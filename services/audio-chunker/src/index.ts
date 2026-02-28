import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import cors from "cors";
import express, { type Request, type Response } from "express";
import multer from "multer";
import pino from "pino";
import { z } from "zod";
import { put } from "@vercel/blob";

const execFileAsync = promisify(execFile);

const logger = pino({ level: process.env.LOG_LEVEL || "info" });
const app = express();

const ONE_GB = 1024 * 1024 * 1024;
const DEFAULT_CHUNK_SECONDS = 10 * 60;
const DEFAULT_OVERLAP_SECONDS = 10;
const MAX_CHUNK_SECONDS = 20 * 60;
const MAX_OVERLAP_SECONDS = 30;
const MAX_CHUNKS = 1000;

const upload = multer({
	dest: tmpdir(),
	limits: {
		fileSize: ONE_GB,
		files: 1,
	},
});

const requestSchema = z
	.object({
		chunkSeconds: z.coerce
			.number()
			.int()
			.min(60)
			.max(MAX_CHUNK_SECONDS)
			.default(DEFAULT_CHUNK_SECONDS),
		overlapSeconds: z.coerce
			.number()
			.int()
			.min(0)
			.max(MAX_OVERLAP_SECONDS)
			.default(DEFAULT_OVERLAP_SECONDS),
	})
	.superRefine((value, ctx) => {
		if (value.overlapSeconds >= value.chunkSeconds) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: "overlapSeconds must be smaller than chunkSeconds",
				path: ["overlapSeconds"],
			});
		}
	});

interface ChunkManifestItem {
	chunkIndex: number;
	blobUrl: string;
	startMs: number;
	endMs: number;
	sizeBytes: number;
	contentType: "audio/flac";
}

interface ChunkResponseBody {
	jobId: string;
	filename: string;
	chunkCount: number;
	totalDurationMs: number;
	chunkSeconds: number;
	overlapSeconds: number;
	chunks: ChunkManifestItem[];
}

function getBlobToken(): string {
	const token =
		process.env.BLOB_READ_WRITE_TOKEN ||
		process.env.M4A_TO_NOTES_READ_WRITE_TOKEN;

	if (!token) {
		throw new Error(
			"Missing BLOB_READ_WRITE_TOKEN or M4A_TO_NOTES_READ_WRITE_TOKEN",
		);
	}

	return token;
}

function parseAllowedOrigins(): string[] | null {
	const raw = process.env.ALLOWED_ORIGINS;
	if (!raw) return null;

	const values = raw
		.split(",")
		.map((origin) => origin.trim())
		.filter(Boolean);
	return values.length > 0 ? values : null;
}

function sanitizeBaseFilename(name: string): string {
	const withoutExtension = name.replace(/\.[^.]+$/, "");
	const basename = path.basename(withoutExtension);
	const sanitized = basename
		.replace(/[^a-zA-Z0-9._-]+/g, "_")
		.replace(/^_+|_+$/g, "")
		.slice(0, 80);

	return sanitized || "audio";
}

async function getDurationSeconds(inputPath: string): Promise<number> {
	const { stdout } = await execFileAsync("ffprobe", [
		"-v",
		"error",
		"-show_entries",
		"format=duration",
		"-of",
		"default=noprint_wrappers=1:nokey=1",
		inputPath,
	]);

	const duration = Number.parseFloat(stdout.trim());
	if (!Number.isFinite(duration) || duration <= 0) {
		throw new Error("Could not determine audio duration with ffprobe");
	}

	return duration;
}

async function createChunkFile(params: {
	inputPath: string;
	outputPath: string;
	startSeconds: number;
	durationSeconds: number;
}): Promise<void> {
	await execFileAsync("ffmpeg", [
		"-hide_banner",
		"-loglevel",
		"error",
		"-y",
		"-ss",
		params.startSeconds.toString(),
		"-t",
		params.durationSeconds.toString(),
		"-i",
		params.inputPath,
		"-vn",
		"-ac",
		"1",
		"-ar",
		"16000",
		"-c:a",
		"flac",
		params.outputPath,
	]);
}

async function uploadChunkToBlob(params: {
	blobPath: string;
	chunkPath: string;
	blobToken: string;
}): Promise<{ url: string; sizeBytes: number }> {
	const data = await readFile(params.chunkPath);
	const chunkStats = await stat(params.chunkPath);

	const blob = await put(params.blobPath, data, {
		access: "public",
		contentType: "audio/flac",
		token: params.blobToken,
	});

	return {
		url: blob.url,
		sizeBytes: chunkStats.size,
	};
}

async function removePath(filePath: string | undefined): Promise<void> {
	if (!filePath) return;
	await rm(filePath, { recursive: true, force: true });
}

const allowedOrigins = parseAllowedOrigins();
app.use(
	cors({
		origin: allowedOrigins ? allowedOrigins : true,
	}),
);
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req: Request, res: Response) => {
	res.status(200).json({ ok: true, service: "audio-chunker" });
});

app.post(
	"/chunk",
	upload.single("audio"),
	async (req: Request, res: Response): Promise<void> => {
		const file = req.file;
		if (!file) {
			res.status(400).json({ error: "Missing file field 'audio'" });
			return;
		}

		let requestOptions: z.infer<typeof requestSchema>;
		try {
			requestOptions = requestSchema.parse(req.body);
		} catch (error) {
			if (error instanceof z.ZodError) {
				res.status(400).json({
					error: "Invalid chunk options",
					details: error.issues,
				});
				return;
			}
			throw error;
		}

		const jobId = randomUUID();
		const inputPath = file.path;
		const baseFilename = sanitizeBaseFilename(file.originalname || "audio");
		const tempChunkDir = path.join(tmpdir(), `audio-chunks-${jobId}`);
			const chunkResults: ChunkManifestItem[] = [];

			try {
				const blobToken = getBlobToken();
				await mkdir(tempChunkDir, { recursive: true });

			const totalDurationSeconds = await getDurationSeconds(inputPath);
			const strideSeconds =
				requestOptions.chunkSeconds - requestOptions.overlapSeconds;

			for (let chunkIndex = 0; chunkIndex < MAX_CHUNKS; chunkIndex++) {
				const startSeconds = chunkIndex * strideSeconds;
				if (startSeconds >= totalDurationSeconds) break;

				const endSeconds = Math.min(
					startSeconds + requestOptions.chunkSeconds,
					totalDurationSeconds,
				);
				const durationSeconds = Math.max(endSeconds - startSeconds, 0.01);
				const chunkName = `${baseFilename}_${chunkIndex.toString().padStart(4, "0")}.flac`;
				const localChunkPath = path.join(tempChunkDir, chunkName);

				await createChunkFile({
					inputPath,
					outputPath: localChunkPath,
					startSeconds,
					durationSeconds,
				});

				const blobPath = `transcription-chunks/${jobId}/${chunkName}`;
				const uploadResult = await uploadChunkToBlob({
					blobPath,
					chunkPath: localChunkPath,
					blobToken,
				});

				chunkResults.push({
					chunkIndex,
					blobUrl: uploadResult.url,
					startMs: Math.round(startSeconds * 1000),
					endMs: Math.round(endSeconds * 1000),
					sizeBytes: uploadResult.sizeBytes,
					contentType: "audio/flac",
				});

				await removePath(localChunkPath);

				if (endSeconds >= totalDurationSeconds) {
					break;
				}
			}

			if (chunkResults.length === 0) {
				throw new Error("No chunks were generated from the provided audio file");
			}

			if (chunkResults.length >= MAX_CHUNKS) {
				throw new Error("Chunk count exceeds service limit");
			}

			const responseBody: ChunkResponseBody = {
				jobId,
				filename: file.originalname,
				chunkCount: chunkResults.length,
				totalDurationMs: Math.round(totalDurationSeconds * 1000),
				chunkSeconds: requestOptions.chunkSeconds,
				overlapSeconds: requestOptions.overlapSeconds,
				chunks: chunkResults,
			};

			logger.info(
				{
					jobId,
					filename: file.originalname,
					chunkCount: chunkResults.length,
					totalDurationMs: responseBody.totalDurationMs,
				},
				"Audio chunking completed",
			);

			res.status(201).json(responseBody);
		} catch (error) {
			logger.error(
				{
					error: error instanceof Error ? error.message : "Unknown error",
					jobId,
				},
				"Audio chunking failed",
			);
			res.status(500).json({
				error:
					error instanceof Error
						? error.message
						: "Failed to chunk and upload audio",
			});
		} finally {
			await removePath(inputPath);
			await removePath(tempChunkDir);
		}
	},
);

app.use(
	(
		error: unknown,
		_req: Request,
		res: Response,
		_next: express.NextFunction,
	) => {
		if (error instanceof multer.MulterError) {
			if (error.code === "LIMIT_FILE_SIZE") {
				res.status(413).json({
					error: "File exceeds 1GB limit",
				});
				return;
			}
			res.status(400).json({ error: error.message });
			return;
		}

		logger.error(
			{ error: error instanceof Error ? error.message : "Unknown error" },
			"Unhandled chunker error",
		);
		res.status(500).json({ error: "Internal server error" });
	},
);

const port = Number.parseInt(process.env.PORT || "8080", 10);
app.listen(port, () => {
	logger.info({ port }, "Audio chunker service started");
});
