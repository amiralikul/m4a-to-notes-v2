import { createAnthropic } from "@ai-sdk/anthropic";
import { generateText, Output } from "ai";
import { z } from "zod";
import type { JobAnalysisResultData } from "@/db/schema";
import { getErrorMessage } from "@/lib/errors";
import type { Logger } from "@/lib/logger";

function sanitizeListItem(value: string): string {
	return value
		.replace(/^\s*[-*•●▪◦‣∙]+\s*/, "")
		.replace(/^\s*\d+[\).\-\s]+/, "")
		.trim();
}

function normalizeListValue(raw: unknown): unknown {
	if (Array.isArray(raw)) {
		return raw
			.map((item) => (typeof item === "string" ? sanitizeListItem(item) : ""))
			.filter((item) => item.length > 0);
	}

	if (typeof raw === "string") {
		return raw
			.split(/\r?\n+/)
			.map(sanitizeListItem)
			.filter((item) => item.length > 0);
	}

	return raw;
}

function listSchema(minItems = 1) {
	return z.preprocess(
		normalizeListValue,
		z.array(z.string().min(1)).min(minItems),
	);
}

const oneWeekPlanSchema = z.object({
	day: z.number().int().min(1).max(7),
	title: z.string().min(1),
	tasks: listSchema(1),
});

const resultSchema = z.object({
	compatibilityScore: z.number().int().min(0).max(100),
	compatibilitySummary: z.string().min(1),
	strengths: listSchema(1),
	gaps: listSchema(1),
	interviewQuestions: listSchema(3),
	interviewPreparation: listSchema(1),
	oneWeekPlan: z.array(oneWeekPlanSchema).length(7),
});

interface AnthropicServiceConfig {
	apiKey: string;
	model: string;
	baseUrl?: string;
	maxRetries?: number;
}

export class AnthropicService {
	readonly model: string;
	readonly provider = "anthropic";
	private readonly apiKey: string;
	private readonly maxRetries: number;
	private readonly logger: Logger;
	private readonly anthropicClient: ReturnType<typeof createAnthropic>;

	constructor(config: AnthropicServiceConfig, logger: Logger) {
		this.apiKey = config.apiKey;
		this.model = config.model;
		this.maxRetries = config.maxRetries ?? 2;
		this.logger = logger;
		this.anthropicClient = createAnthropic({
			apiKey: config.apiKey,
			baseURL: config.baseUrl,
		});
	}

	async analyzeResumeMatch(input: {
		resumeText: string;
		jobDescription: string;
	}): Promise<JobAnalysisResultData> {
		if (!this.apiKey) {
			throw new Error("ANTHROPIC_API_KEY is not configured");
		}

		const start = Date.now();

		try {
			const { output } = await generateText({
				model: this.anthropicClient(this.model),
				output: Output.object({ schema: resultSchema }),
				prompt: this.buildPrompt(input),
				temperature: 0.2,
				maxRetries: this.maxRetries,
				providerOptions: {
					anthropic: {
						structuredOutputMode: "jsonTool",
					},
				},
			});

			this.logger.info("Resume match analysis completed", {
				model: this.model,
				durationMs: Date.now() - start,
				score: output.compatibilityScore,
				maxRetries: this.maxRetries,
			});

			return output;
		} catch (error) {
			this.logger.error("Anthropic analysis failed", {
				model: this.model,
				durationMs: Date.now() - start,
				maxRetries: this.maxRetries,
				error: getErrorMessage(error),
			});
			throw error;
		}
	}

	private buildPrompt(input: {
		resumeText: string;
		jobDescription: string;
	}): string {
		return [
			"Compare this resume against the job description.",
			"Return only JSON matching this schema:",
			`{
  "compatibilityScore": number 0-100,
  "compatibilitySummary": string,
  "strengths": string[],
  "gaps": string[],
  "interviewQuestions": string[],
  "interviewPreparation": string[],
  "oneWeekPlan": [{"day":1-7,"title":"string","tasks":["string"]}]
}`,
				"Rules:",
				"- Evidence-based score.",
				"- Exactly 7 oneWeekPlan entries (days 1-7).",
				"- Keep arrays concise and practical.",
				"- strengths, gaps, interviewQuestions, interviewPreparation, and oneWeekPlan[].tasks must be JSON arrays, never newline strings.",
				"- No markdown, no extra keys.",
			"",
			"Resume:",
			input.resumeText,
			"",
			"Job description:",
			input.jobDescription,
		].join("\n");
	}
}
