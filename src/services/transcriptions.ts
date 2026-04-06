import { and, count, desc, eq, isNull } from "drizzle-orm";
import type {
	DiarizationSegment,
	InsertTranscription,
	Transcription,
	TranscriptionSummaryData,
	UpdateTranscription,
} from "@/db/schema";
import { transcriptions } from "@/db/schema";
import type { AppDatabase, ProductionDatabase } from "@/db/types";
import { getErrorMessage } from "@/lib/errors";
import type { Logger } from "@/lib/logger";
import type { OwnerIdentity } from "@/lib/route";

export const TranscriptionStatus = {
	PENDING: "pending",
	PROCESSING: "processing",
	COMPLETED: "completed",
	FAILED: "failed",
} as const;

export type TranscriptionStatusType =
	(typeof TranscriptionStatus)[keyof typeof TranscriptionStatus];

export const SummaryStatus = {
	PENDING: "pending",
	PROCESSING: "processing",
	COMPLETED: "completed",
	FAILED: "failed",
} as const;

export type SummaryStatusType =
	(typeof SummaryStatus)[keyof typeof SummaryStatus];

export const TranscriptionSource = {
	WEB: "web",
} as const;

export type TranscriptionSourceType =
	(typeof TranscriptionSource)[keyof typeof TranscriptionSource];

export class TranscriptionsService {
	constructor(
		private db: AppDatabase,
		private logger: Logger,
	) {}

	async create({
		audioKey,
		filename,
		source = TranscriptionSource.WEB,
		userMetadata = {},
		userId,
		ownerId,
		enableDiarization = false,
	}: {
		audioKey: string;
		filename: string;
		source?: TranscriptionSourceType;
		userMetadata?: Record<string, unknown>;
		userId?: string;
		ownerId?: string;
		enableDiarization?: boolean;
	}): Promise<string> {
		try {
			const transcriptionId = crypto.randomUUID();

			const now = new Date().toISOString();
			const transcriptionData: InsertTranscription = {
				id: transcriptionId,
				status: TranscriptionStatus.PENDING,
				progress: 0,
				source,
				audioKey,
				filename,
				userMetadata,
				userId,
				ownerId,
				enableDiarization,
				createdAt: now,
				updatedAt: now,
			};

			await this.db.insert(transcriptions).values(transcriptionData);

			this.logger.info("Transcription created", {
				transcriptionId,
				audioKey,
				filename,
				source,
			});

			return transcriptionId;
		} catch (error) {
			this.logger.error("Failed to create transcription", {
				audioKey,
				filename,
				source,
				error: getErrorMessage(error),
			});
			throw error;
		}
	}

	async findByIdForOwner(
		transcriptionId: string,
		owner: OwnerIdentity,
	): Promise<Transcription | null> {
		try {
			if (owner.userId === null && owner.actorId === null) {
				this.logger.warn("Cannot find transcription without owner identity", {
					transcriptionId,
				});
				return null;
			}

			let conditions: ReturnType<typeof and>;
			if (owner.userId !== null) {
				conditions = and(
					eq(transcriptions.id, transcriptionId),
					eq(transcriptions.userId, owner.userId),
				);
			} else {
				if (owner.actorId === null) {
					this.logger.warn("Cannot find transcription without actor identity", {
						transcriptionId,
					});
					return null;
				}

				conditions = and(
					eq(transcriptions.id, transcriptionId),
					isNull(transcriptions.userId),
					eq(transcriptions.ownerId, owner.actorId),
				);
			}

			const result = await this.db
				.select()
				.from(transcriptions)
				.where(conditions)
				.limit(1);

			return result[0] || null;
		} catch (error) {
			this.logger.error("Failed to find transcription for owner", {
				transcriptionId,
				error: getErrorMessage(error),
			});
			throw error;
		}
	}

	async findById(transcriptionId: string): Promise<Transcription | null> {
		try {
			const result = await this.db
				.select()
				.from(transcriptions)
				.where(eq(transcriptions.id, transcriptionId))
				.limit(1);

			return result[0] || null;
		} catch (error) {
			this.logger.error("Failed to find transcription", {
				transcriptionId,
				error: getErrorMessage(error),
			});
			throw error;
		}
	}

	async update(
		transcriptionId: string,
		updates: UpdateTranscription,
	): Promise<Transcription> {
		this.logger.info("Updating transcription", {
			transcriptionId,
			updates: Object.keys(updates),
		});

		try {
			const transcription = await this.findById(transcriptionId);

			if (!transcription) {
				throw new Error(`Transcription not found: ${transcriptionId}`);
			}

			const result = await this.db
				.update(transcriptions)
				.set(updates)
				.where(eq(transcriptions.id, transcriptionId))
				.returning();

			const updatedTranscription = result[0];

			this.logger.info("Transcription updated", {
				transcriptionId,
				status: updatedTranscription.status,
				progress: updatedTranscription.progress,
			});

			return updatedTranscription;
		} catch (error) {
			this.logger.error("Failed to update transcription", {
				transcriptionId,
				error: getErrorMessage(error),
			});
			throw error;
		}
	}

	async markStarted(
		transcriptionId: string,
		progress = 5,
	): Promise<Transcription> {
		return this.update(transcriptionId, {
			status: TranscriptionStatus.PROCESSING,
			progress,
			startedAt: new Date().toISOString(),
		});
	}

	async markCompleted(
		transcriptionId: string,
		preview: string | null = null,
		transcriptText: string,
		diarizationData?: DiarizationSegment[] | null,
	): Promise<Transcription> {
		return this.update(transcriptionId, {
			status: TranscriptionStatus.COMPLETED,
			progress: 100,
			preview,
			transcriptText,
			diarizationData: diarizationData ?? null,
			summaryStatus: SummaryStatus.PENDING,
			summaryError: null,
			summaryUpdatedAt: new Date().toISOString(),
			completedAt: new Date().toISOString(),
		});
	}

	async markFailed(
		transcriptionId: string,
		errorCode: string,
		errorMessage: string,
	): Promise<Transcription> {
		return this.update(transcriptionId, {
			status: TranscriptionStatus.FAILED,
			errorDetails: { code: errorCode, message: errorMessage },
			completedAt: new Date().toISOString(),
		});
	}

	async updateDisplayName(
		transcriptionId: string,
		displayName: string | null,
	): Promise<Transcription> {
		const normalizedDisplayName = displayName?.trim() || null;

		return this.update(transcriptionId, {
			displayName: normalizedDisplayName,
		});
	}

	async updateProgress(
		transcriptionId: string,
		progress: number,
	): Promise<Transcription> {
		return this.update(transcriptionId, { progress });
	}

	async markSummaryStarted(
		transcriptionId: string,
		provider: string,
		model: string,
	): Promise<Transcription> {
		return this.update(transcriptionId, {
			summaryStatus: SummaryStatus.PROCESSING,
			summaryProvider: provider,
			summaryModel: model,
			summaryError: null,
			summaryUpdatedAt: new Date().toISOString(),
		});
	}

	async markSummaryCompleted(
		transcriptionId: string,
		summaryData: TranscriptionSummaryData,
		provider: string,
		model: string,
	): Promise<Transcription> {
		return this.update(transcriptionId, {
			summaryStatus: SummaryStatus.COMPLETED,
			summaryData,
			summaryError: null,
			summaryProvider: provider,
			summaryModel: model,
			summaryUpdatedAt: new Date().toISOString(),
		});
	}

	async markSummaryFailed(
		transcriptionId: string,
		errorCode: string,
		errorMessage: string,
		provider?: string,
		model?: string,
	): Promise<Transcription> {
		return this.update(transcriptionId, {
			summaryStatus: SummaryStatus.FAILED,
			summaryError: { code: errorCode, message: errorMessage },
			summaryProvider: provider,
			summaryModel: model,
			summaryUpdatedAt: new Date().toISOString(),
		});
	}

	async markSummaryPending(transcriptionId: string): Promise<Transcription> {
		return this.update(transcriptionId, {
			summaryStatus: SummaryStatus.PENDING,
			summaryData: null,
			summaryError: null,
			summaryUpdatedAt: new Date().toISOString(),
		});
	}

	async findByStatus(
		status: TranscriptionStatusType,
		limit = 100,
	): Promise<Transcription[]> {
		try {
			return await this.db
				.select()
				.from(transcriptions)
				.where(eq(transcriptions.status, status))
				.limit(limit)
				.orderBy(transcriptions.createdAt);
		} catch (error) {
			this.logger.error("Failed to find transcriptions by status", {
				status,
				error: getErrorMessage(error),
			});
			throw error;
		}
	}

	async findAll(limit = 20): Promise<Transcription[]> {
		try {
			return await this.db
				.select()
				.from(transcriptions)
				.limit(limit)
				.orderBy(transcriptions.createdAt);
		} catch (error) {
			this.logger.error("Failed to find all transcriptions", {
				error: getErrorMessage(error),
			});
			throw error;
		}
	}

	async findByUserId(userId: string, limit = 50): Promise<Transcription[]> {
		try {
			return await this.db
				.select()
				.from(transcriptions)
				.where(eq(transcriptions.userId, userId))
				.orderBy(desc(transcriptions.createdAt))
				.limit(limit);
		} catch (error) {
			this.logger.error("Failed to find transcriptions by userId", {
				userId,
				error: getErrorMessage(error),
			});
			throw error;
		}
	}

	async findByActorId(actorId: string, limit = 50): Promise<Transcription[]> {
		try {
			return await this.db
				.select()
				.from(transcriptions)
				.where(
					and(
						isNull(transcriptions.userId),
						eq(transcriptions.ownerId, actorId),
					),
				)
				.orderBy(desc(transcriptions.createdAt))
				.limit(limit);
		} catch (error) {
			this.logger.error("Failed to find transcriptions by actorId", {
				actorId,
				error: getErrorMessage(error),
			});
			throw error;
		}
	}

	async countByUserId(userId: string): Promise<number> {
		try {
			const result = await (this.db as ProductionDatabase)
				.select({ count: count() })
				.from(transcriptions)
				.where(eq(transcriptions.userId, userId));
			return Number(result[0]?.count ?? 0);
		} catch (error) {
			this.logger.error("Failed to count transcriptions by userId", {
				userId,
				error: getErrorMessage(error),
			});
			throw error;
		}
	}

	async countByActorId(actorId: string): Promise<number> {
		try {
			const result = await (this.db as ProductionDatabase)
				.select({ count: count() })
				.from(transcriptions)
				.where(
					and(
						isNull(transcriptions.userId),
						eq(transcriptions.ownerId, actorId),
					),
				);
			return Number(result[0]?.count ?? 0);
		} catch (error) {
			this.logger.error("Failed to count transcriptions by actorId", {
				actorId,
				error: getErrorMessage(error),
			});
			throw error;
		}
	}

	async delete(transcriptionId: string): Promise<void> {
		try {
			await this.db
				.delete(transcriptions)
				.where(eq(transcriptions.id, transcriptionId));

			this.logger.info("Transcription deleted", { transcriptionId });
		} catch (error) {
			this.logger.error("Failed to delete transcription", {
				transcriptionId,
				error: getErrorMessage(error),
			});
			throw error;
		}
	}

	async getDetail(transcriptionId: string) {
		const transcription = await this.findById(transcriptionId);

		if (!transcription) {
			return null;
		}

		return this.mapDetail(transcription);
	}

	async getDetailForOwner(
		transcriptionId: string,
		owner: OwnerIdentity,
	) {
		const transcription = await this.findByIdForOwner(transcriptionId, owner);

		if (!transcription) {
			return null;
		}

		return this.mapDetail(transcription);
	}

	async getStatus(transcriptionId: string) {
		const transcription = await this.findById(transcriptionId);

		if (!transcription) {
			return null;
		}

		return this.mapStatus(transcription);
	}

	async getStatusForOwner(
		transcriptionId: string,
		owner: OwnerIdentity,
	) {
		const transcription = await this.findByIdForOwner(transcriptionId, owner);

		if (!transcription) {
			return null;
		}

		return this.mapStatus(transcription);
	}

	private mapDetail(transcription: Transcription) {
		return {
			transcriptionId: transcription.id,
			status: transcription.status,
			progress: transcription.progress,
			filename: transcription.filename,
			displayName: transcription.displayName,
			createdAt: transcription.createdAt,
			completedAt: transcription.completedAt,
			preview: transcription.preview,
			contentType: transcription.contentType,
			enableDiarization: transcription.enableDiarization,
			diarizationData: transcription.diarizationData ?? null,
			transcriptText: transcription.transcriptText,
			summaryStatus: transcription.summaryStatus,
			summaryUpdatedAt: transcription.summaryUpdatedAt,
			error: transcription.errorDetails
				? {
						code: transcription.errorDetails.code,
						message: transcription.errorDetails.message,
					}
				: undefined,
			summaryError: transcription.summaryError
				? {
						code: transcription.summaryError.code,
						message: transcription.summaryError.message,
					}
				: undefined,
		};
	}

	private mapStatus(transcription: Transcription) {
		return {
			transcriptionId: transcription.id,
			jobId: transcription.id,
			status: transcription.status,
			progress: transcription.progress,
			filename: transcription.filename,
			createdAt: transcription.createdAt,
			startedAt: transcription.startedAt,
			completedAt: transcription.completedAt,
			updatedAt: transcription.updatedAt,
			preview: transcription.preview,
			summaryStatus: transcription.summaryStatus,
			summaryUpdatedAt: transcription.summaryUpdatedAt,
			error: transcription.errorDetails
				? {
						code: transcription.errorDetails.code,
						message: transcription.errorDetails.message,
					}
				: undefined,
			summaryError: transcription.summaryError
				? {
						code: transcription.summaryError.code,
						message: transcription.summaryError.message,
					}
				: undefined,
		};
	}
}
