import OpenAI from "openai";
import { z } from "zod";
import {
	SummaryError,
	TranscriptionError,
	getErrorMessage,
} from "@/lib/errors";
import type { Logger } from "@/lib/logger";

export type TranscriptionProvider = "groq" | "openai";
export type SummaryProvider = "openai";

export interface SummaryActionItem {
	task: string;
	owner?: string;
	dueDate?: string;
}

export interface SummaryResult {
	summary: string;
	keyPoints: string[];
	actionItems: SummaryActionItem[];
	keyTakeaways: string[];
}

export interface AiServiceConfig {
	provider: TranscriptionProvider;
	summaryProvider: SummaryProvider;
	summaryModel?: string;
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

const SUMMARY_PROVIDER_CONFIG = {
	openai: {
		baseURL: undefined,
		model: "gpt-5-mini",
	},
} as const;

const VALID_PROVIDERS: TranscriptionProvider[] = ["groq", "openai"];
const VALID_SUMMARY_PROVIDERS: SummaryProvider[] = ["openai"];
const MAX_SUMMARY_TRANSCRIPT_CHARS = 120_000;

const summarySchema = z.object({
	summary: z.string().min(1),
	keyPoints: z.array(z.string().min(1)).min(1),
	actionItems: z.array(
		z.object({
			task: z.string().min(1),
			owner: z.string().optional(),
			dueDate: z.string().optional(),
		}),
	),
	keyTakeaways: z.array(z.string().min(1)).min(1),
});

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

export function parseSummaryProvider(
	value: string | undefined,
): SummaryProvider {
	if (!value) return "openai";
	if (VALID_SUMMARY_PROVIDERS.includes(value as SummaryProvider)) {
		return value as SummaryProvider;
	}
	throw new Error(
		`Invalid SUMMARY_PROVIDER "${value}". Must be one of: ${VALID_SUMMARY_PROVIDERS.join(", ")}`,
	);
}

export class AiService {
	private readonly client: OpenAI;
	private summaryClient: OpenAI | null = null;
	private readonly logger: Logger;
	private readonly openaiKey: string;
	private readonly groqKey: string;
	readonly provider: TranscriptionProvider;
	readonly model: string;
	readonly summaryProvider: SummaryProvider;
	readonly summaryModel: string;

	constructor(config: AiServiceConfig, logger: Logger) {
		this.provider = config.provider;
		this.model = PROVIDER_CONFIG[config.provider].model;
		this.summaryProvider = config.summaryProvider;
		this.summaryModel =
			config.summaryModel ||
			SUMMARY_PROVIDER_CONFIG[config.summaryProvider].model;
		this.openaiKey = config.openaiKey;
		this.groqKey = config.groqKey;
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

	async transcribeAudioFromUrl(audioUrl: string): Promise<string> {
		if (this.provider !== "groq") {
			throw new TranscriptionError(
				'URL-based transcription is only supported for "groq" provider',
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

	async generateSummary(transcriptText: string): Promise<SummaryResult> {
		if (!transcriptText.trim()) {
			throw new SummaryError("Cannot generate summary for empty transcript");
		}

		const promptTranscript =
			transcriptText.length > MAX_SUMMARY_TRANSCRIPT_CHARS
				? `${transcriptText.slice(0, MAX_SUMMARY_TRANSCRIPT_CHARS)}\n\n[Transcript truncated for summarization.]`
				: transcriptText;

		const startTime = Date.now();
		this.logger.info("Starting summary generation", {
			provider: this.summaryProvider,
			model: this.summaryModel,
			transcriptLength: transcriptText.length,
			truncated: transcriptText.length > MAX_SUMMARY_TRANSCRIPT_CHARS,
		});

		try {
			const completion = await this.getSummaryClient().chat.completions.create({
				model: this.summaryModel,
				response_format: { type: "json_object" },
				messages: [
					{
						role: "system",
						content:
							"You summarize meeting transcripts. Return valid JSON with keys: summary (string), keyPoints (string[]), actionItems ({task:string, owner?:string, dueDate?:string}[]), keyTakeaways (string[]). Keep content concise and factual.",
					},
					{
						role: "user",
						content: `Summarize this transcript:\n\n${promptTranscript}`,
					},
				],
			});

			const responseText = completion.choices[0]?.message?.content;
			if (!responseText) {
				throw new SummaryError("Summary response was empty");
			}

			let parsed: unknown;
			try {
				parsed = JSON.parse(responseText);
			} catch (parseError) {
				throw new SummaryError(
					`Failed to parse summary JSON: ${getErrorMessage(parseError)}`,
				);
			}

			const result = summarySchema.parse(parsed);

			this.logger.info("Summary generation completed", {
				provider: this.summaryProvider,
				model: this.summaryModel,
				duration: `${Date.now() - startTime}ms`,
				summaryLength: result.summary.length,
				keyPoints: result.keyPoints.length,
				actionItems: result.actionItems.length,
				keyTakeaways: result.keyTakeaways.length,
			});

			return result;
		} catch (error) {
			const errorMsg = getErrorMessage(error);
			this.logger.error("Summary generation failed", {
				provider: this.summaryProvider,
				model: this.summaryModel,
				duration: `${Date.now() - startTime}ms`,
				error: errorMsg,
			});
			if (error instanceof SummaryError) {
				throw error;
			}
			throw new SummaryError(`Failed to generate summary: ${errorMsg}`);
		}
	}

	private getSummaryClient(): OpenAI {
		if (this.summaryProvider !== "openai") {
			throw new SummaryError(
				`Summary provider "${this.summaryProvider}" is not implemented`,
			);
		}

		if (!this.openaiKey) {
			throw new SummaryError(
				`Missing API key for summary provider "${this.summaryProvider}"`,
			);
		}

		if (!this.summaryClient) {
			this.summaryClient = new OpenAI({
				apiKey: this.openaiKey,
				baseURL: SUMMARY_PROVIDER_CONFIG[this.summaryProvider].baseURL,
			});
		}

		return this.summaryClient;
	}
}
