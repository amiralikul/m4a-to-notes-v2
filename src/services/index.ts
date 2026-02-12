import { db } from "@/db";
import { logger } from "@/lib/logger";
import { TranscriptionsService } from "./transcriptions";
import { UsersService } from "./users";
import { ConversationService } from "./conversation";
import { AiService } from "./ai.service";
import { StorageService } from "./storage";
import { TranscriptionOrchestrator } from "./transcription-orchestrator";

export const transcriptionsService = new TranscriptionsService(db, logger);
export const usersService = new UsersService(db, logger);
export const conversationService = new ConversationService(db, logger);
export const aiService = new AiService(
	process.env.OPENAI_API_KEY || "",
	logger,
);
export const storageService = new StorageService();
export const orchestrator = new TranscriptionOrchestrator(
	transcriptionsService,
	storageService,
	aiService,
	logger,
);
