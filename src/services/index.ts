import { db } from "@/db";
import { logger } from "@/lib/logger";
import { TranscriptionsService } from "./transcriptions";
import { UsersService } from "./users";
import { ConversationService } from "./conversation";
import {
	AiService,
	parseProvider,
	parseSummaryProvider,
} from "./ai.service";
import { StorageService } from "./storage";
import { WorkflowService } from "./workflow";
import { TrialUsageService } from "./trial-usage";
import { ActorsService } from "./actors";
import { JobAnalysesService } from "./job-analyses";
import { BrightDataService } from "./brightdata.service";
import { AnthropicService } from "./anthropic.service";
import { TranslationsService } from "./translations";

export const transcriptionsService = new TranscriptionsService(db, logger);
export const usersService = new UsersService(db, logger);
export const conversationService = new ConversationService(db, logger);

const provider = parseProvider(process.env.TRANSCRIPTION_PROVIDER);
const summaryProvider = parseSummaryProvider(process.env.SUMMARY_PROVIDER);
export const aiService = new AiService(
	{
		provider,
		summaryProvider,
		summaryModel: process.env.SUMMARY_MODEL,
		groqKey: process.env.GROQ_API_KEY || "",
		openaiKey: process.env.OPENAI_API_KEY || "",
	},
	logger,
);

export const storageService = new StorageService();
export const workflowService = new WorkflowService(logger);
export const trialUsageService = new TrialUsageService(db, logger);
export const actorsService = new ActorsService(db, logger);
export const jobAnalysesService = new JobAnalysesService(db, logger);
export const brightDataService = new BrightDataService(
	{
		apiKey: process.env.BRIGHTDATA_API_KEY || "",
		datasetId:
			process.env.BRIGHTDATA_LINKEDIN_JOBS_DATASET_ID || "gd_lpfll7v5hcqtkxl6l",
	},
	logger,
);
export const anthropicService = new AnthropicService(
	{
		apiKey: process.env.ANTHROPIC_API_KEY || "",
		model: process.env.ANTHROPIC_MODEL || "claude-haiku-4-5",
		maxRetries: Number.parseInt(
			process.env.ANTHROPIC_MAX_RETRIES ||
				process.env.ANTHROPIC_MAX_ATTEMPTS ||
				"2",
			10,
		),
	},
	logger,
);
export const translationsService = new TranslationsService(db, logger);
