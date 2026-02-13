import OpenAI from "openai";
import { TranscriptionError, getErrorMessage } from "@/lib/errors";
import type { Logger } from "@/lib/logger";

export type TranscriptionProvider = "groq" | "openai";

export interface AiServiceConfig {
	provider: TranscriptionProvider;
	groqKey: string;
	openaiKey: string;
}

const PROVIDER_CONFIG = {
	groq: {
		baseURL: "https://api.groq.com/openai/v1",
		model: "whisper-large-v3-turbo",
	},
	openai: {
		baseURL: undefined,
		model: "whisper-1",
	},
} as const;

const VALID_PROVIDERS: TranscriptionProvider[] = ["groq", "openai"];

export function parseProvider(
	value: string | undefined,
): TranscriptionProvider {
	if (!value) return "groq";
	if (VALID_PROVIDERS.includes(value as TranscriptionProvider)) {
		return value as TranscriptionProvider;
	}
	throw new Error(
		`Invalid TRANSCRIPTION_PROVIDER "${value}". Must be one of: ${VALID_PROVIDERS.join(", ")}`,
	);
}

export class AiService {
	private readonly client: OpenAI;
	private readonly logger: Logger;
	readonly provider: TranscriptionProvider;
	readonly model: string;

	constructor(config: AiServiceConfig, logger: Logger) {
		this.provider = config.provider;
		this.model = PROVIDER_CONFIG[config.provider].model;
		this.logger = logger;

		const apiKey =
			config.provider === "groq" ? config.groqKey : config.openaiKey;
		if (!apiKey) {
			throw new Error(
				`Missing API key for transcription provider "${config.provider}"`,
			);
		}

		this.client = new OpenAI({
			apiKey,
			baseURL: PROVIDER_CONFIG[config.provider].baseURL,
		});
	}

	async transcribeAudio(audioBuffer: ArrayBuffer): Promise<string> {
		this.logger.info("Starting transcription", {
			provider: this.provider,
			model: this.model,
			audioSize: audioBuffer.byteLength,
			audioSizeMB: (audioBuffer.byteLength / 1024 / 1024).toFixed(2),
		});

		const startTime = Date.now();

		try {
			// Groq rate limits (whisper-large-v3-turbo): 20 req/min, 2M audio-sec/day.
			// Handled by Inngest's built-in retry with backoff (4 retries).
			const transcription = await this.client.audio.transcriptions.create({
				file: new File([audioBuffer], "audio.m4a", { type: "audio/m4a" }),
				model: this.model,
			});

			const duration = Date.now() - startTime;

			this.logger.info("Transcription completed", {
				provider: this.provider,
				model: this.model,
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
				provider: this.provider,
				model: this.model,
				duration: `${duration}ms`,
				audioSize: audioBuffer.byteLength,
				audioSizeMB: (audioBuffer.byteLength / 1024 / 1024).toFixed(2),
			};

			if (error && typeof error === "object" && "status" in error) {
				errorDetails.apiStatus = (error as { status: unknown }).status;
			}
			if (error && typeof error === "object" && "code" in error) {
				errorDetails.apiCode = (error as { code: unknown }).code;
			}

			this.logger.error("Transcription failed", errorDetails);
			throw new TranscriptionError(
				`Failed to transcribe audio: ${errorMsg}`,
			);
		}
	}
}
