import { db } from "@/db";
import { logger } from "@/lib/logger";
import { TranscriptionsService } from "./transcriptions";
import { UsersService } from "./users";
import { StorageService } from "./storage";
import { WorkflowService } from "./workflow";
import { TrialUsageService } from "./trial-usage";
import { ActorsService } from "./actors";
import { JobAnalysesService } from "./job-analyses";
import { BrightDataService } from "./brightdata.service";
import {
	AssemblyAiService,
	JobFitAiService,
	parseTextAiProvider,
	parseTranscriptionProvider,
	TextAiService,
	TranscriptionChatAiService,
	TranscriptionAiService,
} from "./ai";
import { TranslationsService } from "./translations";
import { BillingSubscriptionsService } from "./billing-subscriptions";
import { TranscriptionChunksService } from "./transcription-chunks";
import { TranscriptionChatsService } from "./transcription-chats";
import { TranscriptionChatRetrievalService } from "./transcription-chat-retrieval";
import { env } from "@/env";

export const transcriptionsService = new TranscriptionsService(db, logger);
export const transcriptionChunksService = new TranscriptionChunksService(db, logger);
export const transcriptionChatsService = new TranscriptionChatsService(db, logger);
export const transcriptionChatRetrievalService = new TranscriptionChatRetrievalService(
	db,
	logger,
);
export const usersService = new UsersService(db, logger);

const transcriptionProvider = parseTranscriptionProvider(
	env.TRANSCRIPTION_PROVIDER,
);
const textAiProvider = parseTextAiProvider(env.SUMMARY_PROVIDER);

export const transcriptionAiService = new TranscriptionAiService(
	{
		provider: transcriptionProvider,
		groqKey: env.GROQ_API_KEY || "",
		openaiKey: env.OPENAI_API_KEY || "",
	},
	logger,
);
export const textAiService = new TextAiService(
	{
		provider: textAiProvider,
		model: env.SUMMARY_MODEL,
		openaiKey: env.OPENAI_API_KEY || "",
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
		apiKey: env.BRIGHTDATA_API_KEY || "",
		datasetId: env.BRIGHTDATA_LINKEDIN_JOBS_DATASET_ID,
	},
	logger,
);
export const jobFitAiService = new JobFitAiService(
	{
		apiKey: env.ANTHROPIC_API_KEY || "",
		model: env.ANTHROPIC_MODEL,
		maxRetries: env.ANTHROPIC_MAX_RETRIES ?? env.ANTHROPIC_MAX_ATTEMPTS ?? 2,
	},
	logger,
);
export const translationsService = new TranslationsService(db, logger);
export const assemblyAiService = new AssemblyAiService(
	{ apiKey: env.ASSEMBLYAI_API_KEY || "" },
	logger,
);
export const billingSubscriptionsService = new BillingSubscriptionsService(
	db,
	logger,
);
export const transcriptionChatAiService = new TranscriptionChatAiService(
	{
		apiKey: env.ANTHROPIC_API_KEY || "",
		model: env.ANTHROPIC_MODEL,
		maxRetries: env.ANTHROPIC_MAX_RETRIES ?? env.ANTHROPIC_MAX_ATTEMPTS ?? 2,
	},
	logger,
);
