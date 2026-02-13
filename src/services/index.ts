import { db } from "@/db";
import { logger } from "@/lib/logger";
import { TranscriptionsService } from "./transcriptions";
import { UsersService } from "./users";
import { ConversationService } from "./conversation";
import { AiService, parseProvider } from "./ai.service";
import { StorageService } from "./storage";

export const transcriptionsService = new TranscriptionsService(db, logger);
export const usersService = new UsersService(db, logger);
export const conversationService = new ConversationService(db, logger);

const provider = parseProvider(process.env.TRANSCRIPTION_PROVIDER);
export const aiService = new AiService(
	{
		provider,
		groqKey: process.env.GROQ_API_KEY || "",
		openaiKey: process.env.OPENAI_API_KEY || "",
	},
	logger,
);

export const storageService = new StorageService();