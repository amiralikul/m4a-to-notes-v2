import OpenAI from "openai";
import { TranscriptionError, getErrorMessage } from "@/lib/errors";
import type { Logger } from "@/lib/logger";

export class AiService {
	private readonly openai: OpenAI;
	private readonly logger: Logger;

	constructor(openaiKey: string, logger: Logger) {
		this.openai = new OpenAI({ apiKey: openaiKey });
		this.logger = logger;
	}

	async transcribeAudio(audioBuffer: ArrayBuffer): Promise<string> {
		this.logger.info("Starting transcription", {
			audioSize: audioBuffer.byteLength,
			audioSizeMB: (audioBuffer.byteLength / 1024 / 1024).toFixed(2),
		});

		const startTime = Date.now();

		try {
			const transcription = await this.openai.audio.transcriptions.create({
				file: new File([audioBuffer], "audio.m4a", { type: "audio/m4a" }),
				model: "whisper-1",
			});

			const duration = Date.now() - startTime;

			this.logger.info("Transcription completed", {
				duration: `${duration}ms`,
				transcriptionLength: transcription.text.length,
				transcriptionPreview: `${transcription.text.substring(0, 100)}...`,
			});

			return transcription.text;
		} catch (error) {
			const duration = Date.now() - startTime;
			const errorMsg = getErrorMessage(error);

			const errorDetails: Record<string, unknown> = {
				error: errorMsg,
				duration: `${duration}ms`,
				audioSize: audioBuffer.byteLength,
				audioSizeMB: (audioBuffer.byteLength / 1024 / 1024).toFixed(2),
				model: "whisper-1",
			};

			if (error && typeof error === "object" && "status" in error) {
				errorDetails.openaiStatus = (error as { status: unknown }).status;
			}
			if (error && typeof error === "object" && "code" in error) {
				errorDetails.openaiCode = (error as { code: unknown }).code;
			}

			this.logger.error("Transcription failed", errorDetails);
			throw new TranscriptionError(
				`Failed to transcribe audio: ${errorMsg}`,
			);
		}
	}
}
