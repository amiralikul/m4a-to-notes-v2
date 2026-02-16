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
