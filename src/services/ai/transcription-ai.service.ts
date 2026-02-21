import {
	TranscriptionError,
	getErrorMessage,
} from "@/lib/errors";
import type { Logger } from "@/lib/logger";
import { createOpenAiClient } from "./providers/openai.client";

export type TranscriptionProvider = "groq" | "openai";

export interface TranscriptionAiServiceConfig {
	provider: TranscriptionProvider;
	model?: string;
	groqKey: string;
	openaiKey: string;
}

const PROVIDER_CONFIG = {
	groq: {
		baseURL: "https://api.groq.com/openai/v1",
		model: "whisper-large-v3",
	},
	openai: {
		baseURL: undefined,
		model: "whisper-1",
	},
} as const;

const VALID_PROVIDERS: TranscriptionProvider[] = ["groq", "openai"];

export function parseTranscriptionProvider(
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

export class TranscriptionAiService {
	private client: ReturnType<typeof createOpenAiClient> | null = null;
	private readonly logger: Logger;
	private readonly openaiKey: string;
	private readonly groqKey: string;
	readonly provider: TranscriptionProvider;
	readonly model: string;

	constructor(config: TranscriptionAiServiceConfig, logger: Logger) {
		this.provider = config.provider;
		this.model = config.model || PROVIDER_CONFIG[config.provider].model;
		this.openaiKey = config.openaiKey;
		this.groqKey = config.groqKey;
		this.logger = logger;
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
			const transcription = await this.getTranscriptionClient().audio.transcriptions.create({
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

	async transcribeAudioFromUrl(audioUrl: string): Promise<string> {
		if (this.provider !== "groq") {
			throw new TranscriptionError(
				'URL-based transcription is only supported for "groq" provider',
			);
		}
		if (!this.groqKey) {
			throw new TranscriptionError(
				`Missing API key for transcription provider "${this.provider}"`,
			);
		}

		this.logger.info("Starting transcription", {
			provider: this.provider,
			mode: "url",
			model: this.model,
			audioUrl,
		});

		const startTime = Date.now();

		try {
			const formData = new FormData();
			formData.append("model", this.model);
			formData.append("url", audioUrl);

			const response = await fetch(
				`${PROVIDER_CONFIG.groq.baseURL}/audio/transcriptions`,
				{
					method: "POST",
					headers: {
						Authorization: `Bearer ${this.groqKey}`,
					},
					body: formData,
				},
			);

			if (!response.ok) {
				const errorBody = await response.text();
				throw new Error(
					`Groq API error (${response.status}): ${errorBody.slice(0, 300)}`,
				);
			}

			const payload = (await response.json()) as { text?: unknown };
			if (typeof payload.text !== "string") {
				throw new Error("Groq response missing transcription text");
			}

			const duration = Date.now() - startTime;

			this.logger.info("Transcription completed", {
				provider: this.provider,
				mode: "url",
				model: this.model,
				duration: `${duration}ms`,
				transcriptionLength: payload.text.length,
				transcriptionPreview: `${payload.text.substring(0, 100)}...`,
			});

			return payload.text;
		} catch (error) {
			const duration = Date.now() - startTime;
			const errorMsg = getErrorMessage(error);

			this.logger.error("Transcription failed", {
				error: errorMsg,
				provider: this.provider,
				mode: "url",
				model: this.model,
				duration: `${duration}ms`,
				audioUrl,
			});
			throw new TranscriptionError(
				`Failed to transcribe audio: ${errorMsg}`,
			);
		}
	}

	private getTranscriptionClient(): ReturnType<typeof createOpenAiClient> {
		const apiKey = this.provider === "groq" ? this.groqKey : this.openaiKey;
		if (!apiKey) {
			throw new TranscriptionError(
				`Missing API key for transcription provider "${this.provider}"`,
			);
		}

		if (!this.client) {
			this.client = createOpenAiClient({
				apiKey,
				baseURL: PROVIDER_CONFIG[this.provider].baseURL,
			});
		}

		return this.client;
	}
}
