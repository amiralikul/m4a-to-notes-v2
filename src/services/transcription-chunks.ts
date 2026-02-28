import { and, asc, eq } from "drizzle-orm";
import type {
	InsertTranscriptionChunk,
	TranscriptionChunk,
	UpdateTranscriptionChunk,
} from "@/db/schema";
import { transcriptionChunks } from "@/db/schema";
import { getErrorMessage } from "@/lib/errors";
import type { Logger } from "@/lib/logger";

export const TranscriptionChunkStatus = {
	PENDING: "pending",
	PROCESSING: "processing",
	COMPLETED: "completed",
	FAILED: "failed",
} as const;

type Database = Parameters<typeof eq>[0] extends never
	? never
	: // biome-ignore lint: needed for generic DB type
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		any;

export class TranscriptionChunksService {
	constructor(
		private db: Database,
		private logger: Logger,
	) {}

	async createMany(
		transcriptionId: string,
		chunks: Array<{
			chunkIndex: number;
			blobUrl: string;
			startMs: number;
			endMs: number;
		}>,
	): Promise<void> {
		if (chunks.length === 0) return;

		try {
			const now = new Date().toISOString();
			const values: InsertTranscriptionChunk[] = chunks.map((chunk) => ({
				id: crypto.randomUUID(),
				transcriptionId,
				chunkIndex: chunk.chunkIndex,
				blobUrl: chunk.blobUrl,
				startMs: chunk.startMs,
				endMs: chunk.endMs,
				status: TranscriptionChunkStatus.PENDING,
				createdAt: now,
				updatedAt: now,
			}));

			await this.db.insert(transcriptionChunks).values(values);
		} catch (error) {
			this.logger.error("Failed to create transcription chunks", {
				transcriptionId,
				count: chunks.length,
				error: getErrorMessage(error),
			});
			throw error;
		}
	}

	async findByTranscriptionId(transcriptionId: string): Promise<TranscriptionChunk[]> {
		try {
			return await this.db
				.select()
				.from(transcriptionChunks)
				.where(eq(transcriptionChunks.transcriptionId, transcriptionId))
				.orderBy(asc(transcriptionChunks.chunkIndex));
		} catch (error) {
			this.logger.error("Failed to load transcription chunks", {
				transcriptionId,
				error: getErrorMessage(error),
			});
			throw error;
		}
	}

	async update(
		chunkId: string,
		transcriptionId: string,
		updates: UpdateTranscriptionChunk,
	): Promise<void> {
		try {
			await this.db
				.update(transcriptionChunks)
				.set(updates)
				.where(
					and(
						eq(transcriptionChunks.id, chunkId),
						eq(transcriptionChunks.transcriptionId, transcriptionId),
					),
				);
		} catch (error) {
			this.logger.error("Failed to update transcription chunk", {
				chunkId,
				transcriptionId,
				updates: Object.keys(updates),
				error: getErrorMessage(error),
			});
			throw error;
		}
	}

	async markProcessing(
		chunkId: string,
		transcriptionId: string,
	): Promise<void> {
		await this.update(chunkId, transcriptionId, {
			status: TranscriptionChunkStatus.PROCESSING,
			errorDetails: null,
		});
	}

	async markCompleted(
		chunkId: string,
		transcriptionId: string,
		transcriptText: string,
	): Promise<void> {
		await this.update(chunkId, transcriptionId, {
			status: TranscriptionChunkStatus.COMPLETED,
			transcriptText,
			errorDetails: null,
		});
	}

	async markFailed(
		chunkId: string,
		transcriptionId: string,
		errorCode: string,
		errorMessage: string,
	): Promise<void> {
		await this.update(chunkId, transcriptionId, {
			status: TranscriptionChunkStatus.FAILED,
			errorDetails: { code: errorCode, message: errorMessage },
		});
	}
}
