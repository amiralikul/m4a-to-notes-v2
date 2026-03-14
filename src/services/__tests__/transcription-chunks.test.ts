import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanupTestDb, createTestDb } from "@/test/db";
import { createTestLogger } from "@/test/setup";
import {
	TranscriptionChunkStatus,
	TranscriptionChunksService,
} from "../transcription-chunks";
import { TranscriptionsService } from "../transcriptions";

describe("TranscriptionChunksService", () => {
	let transcriptionsService: TranscriptionsService;
	let chunksService: TranscriptionChunksService;
	let db: Awaited<ReturnType<typeof createTestDb>>;

	beforeEach(async () => {
		db = await createTestDb();
		const logger = createTestLogger();
		transcriptionsService = new TranscriptionsService(db, logger);
		chunksService = new TranscriptionChunksService(db, logger);
	});

	afterEach(async () => {
		await cleanupTestDb(db);
	});

	it("creates and lists chunks in chunkIndex order", async () => {
		const transcriptionId = await transcriptionsService.create({
			audioKey: "https://blob.example/audio.m4a",
			filename: "audio.m4a",
		});

		await chunksService.createMany(transcriptionId, [
			{
				chunkIndex: 2,
				blobUrl: "https://blob.example/chunk-2.m4a",
				startMs: 120_000,
				endMs: 180_000,
			},
			{
				chunkIndex: 0,
				blobUrl: "https://blob.example/chunk-0.m4a",
				startMs: 0,
				endMs: 60_000,
			},
		]);

		const chunks = await chunksService.findByTranscriptionId(transcriptionId);
		expect(chunks).toHaveLength(2);
		expect(chunks[0].chunkIndex).toBe(0);
		expect(chunks[1].chunkIndex).toBe(2);
		expect(chunks[0].status).toBe(TranscriptionChunkStatus.PENDING);
	});

	it("updates chunk status transitions", async () => {
		const transcriptionId = await transcriptionsService.create({
			audioKey: "https://blob.example/audio.m4a",
			filename: "audio.m4a",
		});

		await chunksService.createMany(transcriptionId, [
			{
				chunkIndex: 0,
				blobUrl: "https://blob.example/chunk-0.m4a",
				startMs: 0,
				endMs: 60_000,
			},
		]);

		let [chunk] = await chunksService.findByTranscriptionId(transcriptionId);
		await chunksService.markProcessing(chunk.id, transcriptionId);

		[chunk] = await chunksService.findByTranscriptionId(transcriptionId);
		expect(chunk.status).toBe(TranscriptionChunkStatus.PROCESSING);

		await chunksService.markCompleted(
			chunk.id,
			transcriptionId,
			"chunk transcript",
		);

		[chunk] = await chunksService.findByTranscriptionId(transcriptionId);
		expect(chunk.status).toBe(TranscriptionChunkStatus.COMPLETED);
		expect(chunk.transcriptText).toBe("chunk transcript");

		await chunksService.markFailed(
			chunk.id,
			transcriptionId,
			"ERR",
			"chunk failed",
		);

		[chunk] = await chunksService.findByTranscriptionId(transcriptionId);
		expect(chunk.status).toBe(TranscriptionChunkStatus.FAILED);
		expect(chunk.errorDetails).toEqual({
			code: "ERR",
			message: "chunk failed",
		});
	});

	it("throws when updating a non-existent chunk", async () => {
		const transcriptionId = await transcriptionsService.create({
			audioKey: "https://blob.example/audio.m4a",
			filename: "audio.m4a",
		});

		await expect(
			chunksService.markProcessing("missing-chunk-id", transcriptionId),
		).rejects.toThrow(
			`Transcription chunk update matched no rows (chunkId=missing-chunk-id, transcriptionId=${transcriptionId})`,
		);
	});
});
