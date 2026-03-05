import {
	SummaryError,
	TranslationError,
	getErrorMessage,
} from "@/lib/errors";
import type { Logger } from "@/lib/logger";
import { createOpenAiClient } from "./providers/openai.client";
import { summaryResultSchema } from "./schemas/summary.schema";

export type TextAiProvider = "openai";

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

export interface TextAiServiceConfig {
	provider: TextAiProvider;
	model?: string;
	openaiKey: string;
}

const PROVIDER_CONFIG = {
	openai: {
		baseURL: undefined,
		model: "gpt-5-mini",
	},
} as const;

const VALID_PROVIDERS: TextAiProvider[] = ["openai"];
const MAX_TEXT_CHARS = 500_000;

export function parseTextAiProvider(value: string | undefined): TextAiProvider {
	if (!value) return "openai";
	if (VALID_PROVIDERS.includes(value as TextAiProvider)) {
		return value as TextAiProvider;
	}
	throw new Error(
		`Invalid SUMMARY_PROVIDER "${value}". Must be one of: ${VALID_PROVIDERS.join(", ")}`,
	);
}

export class TextAiService {
	private client: ReturnType<typeof createOpenAiClient> | null = null;
	private readonly logger: Logger;
	private readonly openaiKey: string;
	readonly provider: TextAiProvider;
	readonly model: string;

	constructor(config: TextAiServiceConfig, logger: Logger) {
		this.provider = config.provider;
		this.model = config.model || PROVIDER_CONFIG[config.provider].model;
		this.openaiKey = config.openaiKey;
		this.logger = logger;
	}

	async generateSummary(transcriptText: string): Promise<SummaryResult> {
		if (!transcriptText.trim()) {
			throw new SummaryError("Cannot generate summary for empty transcript");
		}

		const promptTranscript =
			transcriptText.length > MAX_TEXT_CHARS
				? `${transcriptText.slice(0, MAX_TEXT_CHARS)}\n\n[Transcript truncated for summarization.]`
				: transcriptText;

		const startTime = Date.now();
		this.logger.info("Starting summary generation", {
			provider: this.provider,
			model: this.model,
			transcriptLength: transcriptText.length,
			truncated: transcriptText.length > MAX_TEXT_CHARS,
		});

		try {
			const completion = await this.getClient().chat.completions.create({
				model: this.model,
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

			const result = summaryResultSchema.parse(parsed);

			this.logger.info("Summary generation completed", {
				provider: this.provider,
				model: this.model,
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
				provider: this.provider,
				model: this.model,
				duration: `${Date.now() - startTime}ms`,
				error: errorMsg,
			});
			if (error instanceof SummaryError) {
				throw error;
			}
			throw new SummaryError(`Failed to generate summary: ${errorMsg}`);
		}
	}

	async translateText(text: string, targetLanguage: string): Promise<string> {
		if (!text.trim()) {
			throw new TranslationError("Cannot translate empty text");
		}

		const promptText =
			text.length > MAX_TEXT_CHARS
				? `${text.slice(0, MAX_TEXT_CHARS)}\n\n[Text truncated for translation.]`
				: text;

		const startTime = Date.now();
		this.logger.info("Starting text translation", {
			provider: this.provider,
			model: this.model,
			targetLanguage,
			textLength: text.length,
		});

		try {
			const completion = await this.getClient().chat.completions.create({
				model: this.model,
				messages: [
					{
						role: "system",
						content: `You are a professional translator. Translate the following text to ${targetLanguage}. Preserve the original formatting, paragraph breaks, and tone. Output only the translated text, nothing else.`,
					},
					{
						role: "user",
						content: promptText,
					},
				],
			});

			const responseText = completion.choices[0]?.message?.content;
			if (!responseText) {
				throw new TranslationError("Translation response was empty");
			}

			this.logger.info("Text translation completed", {
				provider: this.provider,
				model: this.model,
				targetLanguage,
				duration: `${Date.now() - startTime}ms`,
				outputLength: responseText.length,
			});

			return responseText;
		} catch (error) {
			const errorMsg = getErrorMessage(error);
			this.logger.error("Text translation failed", {
				provider: this.provider,
				model: this.model,
				targetLanguage,
				duration: `${Date.now() - startTime}ms`,
				error: errorMsg,
			});
			if (error instanceof TranslationError) throw error;
			throw new TranslationError(`Failed to translate text: ${errorMsg}`);
		}
	}

	async translateSummary(
		summary: SummaryResult,
		targetLanguage: string,
	): Promise<SummaryResult> {
		const startTime = Date.now();
		this.logger.info("Starting summary translation", {
			provider: this.provider,
			model: this.model,
			targetLanguage,
		});

		try {
			const completion = await this.getClient().chat.completions.create({
				model: this.model,
				response_format: { type: "json_object" },
				messages: [
					{
						role: "system",
						content: `You are a professional translator. Translate the following JSON summary to ${targetLanguage}. Preserve the exact JSON structure with keys: summary (string), keyPoints (string[]), actionItems ({task:string, owner?:string, dueDate?:string}[]), keyTakeaways (string[]). Only translate the text values, not the JSON keys. Return valid JSON.`,
					},
					{
						role: "user",
						content: JSON.stringify(summary),
					},
				],
			});

			const responseText = completion.choices[0]?.message?.content;
			if (!responseText) {
				throw new TranslationError("Summary translation response was empty");
			}

			let parsed: unknown;
			try {
				parsed = JSON.parse(responseText);
			} catch (parseError) {
				throw new TranslationError(
					`Failed to parse translated summary JSON: ${getErrorMessage(parseError)}`,
				);
			}

			const result = summaryResultSchema.parse(parsed);

			this.logger.info("Summary translation completed", {
				provider: this.provider,
				model: this.model,
				targetLanguage,
				duration: `${Date.now() - startTime}ms`,
			});

			return result;
		} catch (error) {
			const errorMsg = getErrorMessage(error);
			this.logger.error("Summary translation failed", {
				provider: this.provider,
				model: this.model,
				targetLanguage,
				duration: `${Date.now() - startTime}ms`,
				error: errorMsg,
			});
			if (error instanceof TranslationError) throw error;
			throw new TranslationError(
				`Failed to translate summary: ${errorMsg}`,
			);
		}
	}

	private getClient(): ReturnType<typeof createOpenAiClient> {
		if (!this.openaiKey) {
			throw new SummaryError(
				`Missing API key for summary provider "${this.provider}"`,
			);
		}

		if (!this.client) {
			this.client = createOpenAiClient({
				apiKey: this.openaiKey,
				baseURL: PROVIDER_CONFIG[this.provider].baseURL,
			});
		}

		return this.client;
	}
}
