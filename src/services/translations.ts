import { and, eq } from "drizzle-orm";
import type {
	InsertTranslation,
	Translation,
	TranscriptionSummaryData,
} from "@/db/schema";
import { translations } from "@/db/schema";
import { getErrorMessage } from "@/lib/errors";
import type { Logger } from "@/lib/logger";

export const TranslationStatus = {
	PENDING: "pending",
	PROCESSING: "processing",
	COMPLETED: "completed",
	FAILED: "failed",
} as const;

export type TranslationStatusType =
	(typeof TranslationStatus)[keyof typeof TranslationStatus];

type Database = Parameters<typeof eq>[0] extends never
	? never
	: // biome-ignore lint: needed for generic DB type
		any;

export class TranslationsService {
	constructor(
		private db: Database,
		private logger: Logger,
	) {}

	async create(transcriptionId: string, language: string): Promise<string> {
		try {
			const translationId = crypto.randomUUID();
			const now = new Date().toISOString();

			const data: InsertTranslation = {
				id: translationId,
				transcriptionId,
				language,
				status: TranslationStatus.PENDING,
				createdAt: now,
				updatedAt: now,
			};

			await this.db.insert(translations).values(data);

			this.logger.info("Translation created", {
				translationId,
				transcriptionId,
				language,
			});

			return translationId;
		} catch (error) {
			this.logger.error("Failed to create translation", {
				transcriptionId,
				language,
				error: getErrorMessage(error),
			});
			throw error;
		}
	}

	async findById(translationId: string): Promise<Translation | null> {
		try {
			const result = await this.db
				.select()
				.from(translations)
				.where(eq(translations.id, translationId))
				.limit(1);

			return result[0] || null;
		} catch (error) {
			this.logger.error("Failed to find translation", {
				translationId,
				error: getErrorMessage(error),
			});
			throw error;
		}
	}

	async findByTranscriptionId(
		transcriptionId: string,
	): Promise<Translation[]> {
		try {
			return await this.db
				.select()
				.from(translations)
				.where(eq(translations.transcriptionId, transcriptionId));
		} catch (error) {
			this.logger.error("Failed to find translations by transcriptionId", {
				transcriptionId,
				error: getErrorMessage(error),
			});
			throw error;
		}
	}

	async findByTranscriptionAndLanguage(
		transcriptionId: string,
		language: string,
	): Promise<Translation | null> {
		try {
			const result = await this.db
				.select()
				.from(translations)
				.where(
					and(
						eq(translations.transcriptionId, transcriptionId),
						eq(translations.language, language),
					),
				)
				.limit(1);

			return result[0] || null;
		} catch (error) {
			this.logger.error("Failed to find translation by language", {
				transcriptionId,
				language,
				error: getErrorMessage(error),
			});
			throw error;
		}
	}

	async markStarted(translationId: string): Promise<void> {
		try {
			await this.db
				.update(translations)
				.set({
					status: TranslationStatus.PROCESSING,
					updatedAt: new Date().toISOString(),
				})
				.where(eq(translations.id, translationId));
		} catch (error) {
			this.logger.error("Failed to mark translation started", {
				translationId,
				error: getErrorMessage(error),
			});
			throw error;
		}
	}

	async markCompleted(
		translationId: string,
		translatedText: string,
		translatedSummary: TranscriptionSummaryData,
	): Promise<void> {
		try {
			const now = new Date().toISOString();
			await this.db
				.update(translations)
				.set({
					status: TranslationStatus.COMPLETED,
					translatedText,
					translatedSummary,
					completedAt: now,
					updatedAt: now,
				})
				.where(eq(translations.id, translationId));

			this.logger.info("Translation completed", { translationId });
		} catch (error) {
			this.logger.error("Failed to mark translation completed", {
				translationId,
				error: getErrorMessage(error),
			});
			throw error;
		}
	}

	async markFailed(
		translationId: string,
		code: string,
		errorMessage: string,
	): Promise<void> {
		try {
			await this.db
				.update(translations)
				.set({
					status: TranslationStatus.FAILED,
					errorDetails: { code, message: errorMessage },
					updatedAt: new Date().toISOString(),
				})
				.where(eq(translations.id, translationId));

			this.logger.info("Translation marked as failed", {
				translationId,
				code,
			});
		} catch (error) {
			this.logger.error("Failed to mark translation as failed", {
				translationId,
				error: getErrorMessage(error),
			});
			throw error;
		}
	}

	async deleteByTranscriptionId(transcriptionId: string): Promise<void> {
		try {
			await this.db
				.delete(translations)
				.where(eq(translations.transcriptionId, transcriptionId));

			this.logger.info("Translations deleted for transcription", {
				transcriptionId,
			});
		} catch (error) {
			this.logger.error("Failed to delete translations", {
				transcriptionId,
				error: getErrorMessage(error),
			});
			throw error;
		}
	}

	async delete(translationId: string): Promise<void> {
		try {
			await this.db
				.delete(translations)
				.where(eq(translations.id, translationId));

			this.logger.info("Translation deleted", { translationId });
		} catch (error) {
			this.logger.error("Failed to delete translation", {
				translationId,
				error: getErrorMessage(error),
			});
			throw error;
		}
	}
}
