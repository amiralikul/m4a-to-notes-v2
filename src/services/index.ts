import { db } from "@/db";
import { logger } from "@/lib/logger";
import { TranscriptionsService } from "./transcriptions";
import { UsersService } from "./users";
import { ConversationService } from "./conversation";
import { StorageService } from "./storage";
import { WorkflowService } from "./workflow";
import { TrialUsageService } from "./trial-usage";
import { ActorsService } from "./actors";
import { JobAnalysesService } from "./job-analyses";
import { BrightDataService } from "./brightdata.service";
import {
	JobFitAiService,
	parseTextAiProvider,
	parseTranscriptionProvider,
	TextAiService,
	TranscriptionAiService,
} from "./ai";
import { TranslationsService } from "./translations";

export const transcriptionsService = new TranscriptionsService(db, logger);
export const usersService = new UsersService(db, logger);
export const conversationService = new ConversationService(db, logger);

const transcriptionProvider = parseTranscriptionProvider(
	process.env.TRANSCRIPTION_PROVIDER,
);
const textAiProvider = parseTextAiProvider(process.env.SUMMARY_PROVIDER);

export const transcriptionAiService = new TranscriptionAiService(
	{
		provider: transcriptionProvider,
		groqKey: process.env.GROQ_API_KEY || "",
		openaiKey: process.env.OPENAI_API_KEY || "",
	},
	logger,
);
export const textAiService = new TextAiService(
	{
		provider: textAiProvider,
		model: process.env.SUMMARY_MODEL,
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
export const jobFitAiService = new JobFitAiService(
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
