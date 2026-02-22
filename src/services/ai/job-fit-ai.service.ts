import { generateText, Output } from "ai";
import type { JobAnalysisResultData } from "@/db/schema";
import { getErrorMessage } from "@/lib/errors";
import type { Logger } from "@/lib/logger";
import { buildJobFitPrompt } from "./prompts/job-fit.prompt";
import { createAnthropicClient } from "./providers/anthropic.client";
import { jobFitResultSchema } from "./schemas/job-fit.schema";

export interface JobFitAiServiceConfig {
	apiKey: string;
	model: string;
	baseUrl?: string;
	maxRetries?: number;
}

export class JobFitAiService {
	readonly model: string;
	readonly provider = "anthropic";
	private readonly apiKey: string;
	private readonly maxRetries: number;
	private readonly logger: Logger;
	private readonly anthropicClient: ReturnType<typeof createAnthropicClient>;

	constructor(config: JobFitAiServiceConfig, logger: Logger) {
		this.apiKey = config.apiKey;
		this.model = config.model;
		this.maxRetries = config.maxRetries ?? 2;
		this.logger = logger;
		this.anthropicClient = createAnthropicClient({
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
				output: Output.object({ schema: jobFitResultSchema }),
				prompt: buildJobFitPrompt(input),
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
}
