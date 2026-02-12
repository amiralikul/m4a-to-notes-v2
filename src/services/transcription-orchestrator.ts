import type { TranscriptionsService } from "./transcriptions";
import { TranscriptionStatus } from "./transcriptions";
import type { StorageService } from "./storage";
import type { AiService } from "./ai.service";
import { getErrorMessage } from "@/lib/errors";
import type { Logger } from "@/lib/logger";

export class TranscriptionOrchestrator {
	constructor(
		private transcriptionsService: TranscriptionsService,
		private storageService: StorageService,
		private aiService: AiService,
		private logger: Logger,
	) {}

	async processTranscription(transcriptionId: string): Promise<void> {
		this.logger.info("Starting transcription processing", {
			transcriptionId,
		});

		const transcription =
			await this.transcriptionsService.findById(transcriptionId);
		if (!transcription) {
			throw new Error(`Transcription not found: ${transcriptionId}`);
		}

		// Idempotency: skip if already terminal
		if (transcription.status === TranscriptionStatus.COMPLETED) {
			this.logger.info(
				"Transcription already completed, skipping processing",
				{ transcriptionId, status: transcription.status },
			);
			return;
		}

		if (transcription.status === TranscriptionStatus.FAILED) {
			this.logger.info(
				"Transcription already failed, skipping processing",
				{ transcriptionId, status: transcription.status },
			);
			return;
		}

		if (transcription.status === TranscriptionStatus.PROCESSING) {
			this.logger.warn(
				"Transcription already in processing state, continuing (possible retry)",
				{
					transcriptionId,
					status: transcription.status,
					progress: transcription.progress,
				},
			);
		} else if (transcription.status !== TranscriptionStatus.PENDING) {
			throw new Error(
				`Transcription ${transcriptionId} is in unexpected status: ${transcription.status}`,
			);
		}

		try {
			await this.transcriptionsService.markStarted(transcriptionId, 5);

			this.logger.info("Downloading audio file", {
				transcriptionId,
				audioKey: transcription.audioKey,
			});
			const audioBuffer = await this.storageService.downloadContent(
				transcription.audioKey,
			);

			await this.transcriptionsService.updateProgress(transcriptionId, 20);

			this.logger.info("Starting transcription", {
				transcriptionId,
				fileSize: audioBuffer.byteLength,
			});
			const transcriptText =
				await this.aiService.transcribeAudio(audioBuffer);

			if (!transcriptText.trim()) {
				throw new Error("No speech detected in audio");
			}

			await this.transcriptionsService.updateProgress(transcriptionId, 90);

			const preview =
				transcriptText.substring(0, 150) +
				(transcriptText.length > 150 ? "..." : "");
			await this.transcriptionsService.markCompleted(
				transcriptionId,
				preview,
				transcriptText,
			);

			// Clean up: delete processed audio file
			try {
				await this.storageService.deleteObject(transcription.audioKey);
				this.logger.info("Cleaned up processed audio file", {
					transcriptionId,
					audioKey: transcription.audioKey,
				});
			} catch (cleanupError) {
				this.logger.warn("Failed to clean up audio file", {
					transcriptionId,
					audioKey: transcription.audioKey,
					error: getErrorMessage(cleanupError),
				});
			}

			this.logger.info("Transcription completed successfully", {
				transcriptionId,
				transcriptionLength: transcriptText.length,
			});
		} catch (error) {
			this.logger.error("Transcription processing failed", {
				transcriptionId,
				error: getErrorMessage(error),
				audioKey: transcription.audioKey,
				filename: transcription.filename,
			});

			try {
				let errorCode = "TRANSCRIPTION_ERROR";
				const errorMsg = getErrorMessage(error);
				if (errorMsg.includes("OpenAI") || errorMsg.includes("API")) {
					errorCode = "OPENAI_API_ERROR";
				} else if (errorMsg.includes("No speech detected")) {
					errorCode = "NO_SPEECH_DETECTED";
				} else if (
					errorMsg.includes("File size") ||
					errorMsg.includes("too large")
				) {
					errorCode = "FILE_SIZE_ERROR";
				}

				await this.transcriptionsService.markFailed(
					transcriptionId,
					errorCode,
					getErrorMessage(error),
				);

				if (transcription.audioKey) {
					try {
						await this.storageService.deleteObject(transcription.audioKey);
					} catch (cleanupError) {
						this.logger.warn(
							"Failed to clean up audio file after transcription failure",
							{
								transcriptionId,
								audioKey: transcription.audioKey,
								cleanupError: getErrorMessage(cleanupError),
							},
						);
					}
				}
			} catch (dbError) {
				this.logger.error(
					"Failed to mark transcription as failed in database",
					{
						transcriptionId,
						originalError: getErrorMessage(error),
						dbError: getErrorMessage(dbError),
					},
				);
			}

			throw error;
		}
	}

	private guessMimeType(filename: string): string {
		const ext = filename.toLowerCase().split(".").pop();
		switch (ext) {
			case "m4a":
				return "audio/m4a";
			case "mp3":
				return "audio/mpeg";
			case "wav":
				return "audio/wav";
			case "ogg":
				return "audio/ogg";
			default:
				return "audio/m4a";
		}
	}
}
