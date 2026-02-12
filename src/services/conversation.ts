import { eq, lt } from "drizzle-orm";
import type { ConversationData, InsertConversation } from "@/db/schema";
import { conversations } from "@/db/schema";
import { getErrorMessage } from "@/lib/errors";
import type { Logger } from "@/lib/logger";

// biome-ignore lint: needed for generic DB type
type Database = any;

export class ConversationService {
	constructor(
		private db: Database,
		private logger: Logger,
	) {}

	getConversationKey(chatId: string): string {
		return chatId.toString();
	}

	async getConversation(chatId: string): Promise<ConversationData> {
		const key = this.getConversationKey(chatId);
		try {
			await this.cleanupExpiredConversations();

			const result = await this.db
				.select()
				.from(conversations)
				.where(eq(conversations.chatId, key))
				.limit(1);

			if (result[0]) {
				this.logger.debug("Retrieved conversation context", {
					chatId,
					messageCount: result[0].data.messages?.length || 0,
				});
				return result[0].data;
			}
			return this.createNewConversation();
		} catch (error) {
			this.logger.error("Failed to retrieve conversation", {
				chatId,
				error: getErrorMessage(error),
			});
			return this.createNewConversation();
		}
	}

	createNewConversation(): ConversationData {
		return {
			messages: [],
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		};
	}

	async saveConversation(
		chatId: string,
		conversation: ConversationData,
	): Promise<void> {
		const key = this.getConversationKey(chatId);
		conversation.updatedAt = new Date().toISOString();

		const expiresAt = new Date(
			Date.now() + 7 * 24 * 60 * 60 * 1000,
		).toISOString();

		try {
			const conversationData: InsertConversation = {
				chatId: key,
				data: conversation,
				expiresAt,
			};

			await this.db
				.insert(conversations)
				.values(conversationData)
				.onConflictDoUpdate({
					target: conversations.chatId,
					set: {
						data: conversation,
						expiresAt,
					},
				});

			this.logger.debug("Saved conversation context", {
				chatId,
				messageCount: conversation.messages?.length || 0,
			});
		} catch (error) {
			this.logger.error("Failed to save conversation", {
				chatId,
				error: getErrorMessage(error),
			});
			throw error;
		}
	}

	async addTranscription(
		chatId: string,
		transcription: string,
		audioFileId: string,
	) {
		const conversation = await this.getConversation(chatId);

		const message = {
			id: Date.now().toString(),
			type: "transcription" as const,
			content: transcription,
			audioFileId,
			timestamp: new Date().toISOString(),
		};

		conversation.messages.push(message);
		await this.saveConversation(chatId, conversation);

		this.logger.info("Added transcription to conversation", {
			chatId,
			messageId: message.id,
			transcriptionLength: transcription.length,
		});

		return message;
	}

	async addUserMessage(chatId: string, text: string, messageId: string) {
		const conversation = await this.getConversation(chatId);

		const message = {
			id: messageId.toString(),
			type: "user_message" as const,
			content: text,
			timestamp: new Date().toISOString(),
		};

		conversation.messages.push(message);
		await this.saveConversation(chatId, conversation);

		this.logger.info("Added user message to conversation", {
			chatId,
			messageId: message.id,
		});

		return message;
	}

	async addBotResponse(chatId: string, response: string) {
		const conversation = await this.getConversation(chatId);

		const message = {
			id: Date.now().toString(),
			type: "bot_response" as const,
			content: response,
			timestamp: new Date().toISOString(),
		};

		conversation.messages.push(message);
		await this.saveConversation(chatId, conversation);

		this.logger.info("Added bot response to conversation", {
			chatId,
			messageId: message.id,
		});

		return message;
	}

	async clearConversation(chatId: string): Promise<void> {
		const key = this.getConversationKey(chatId);
		try {
			await this.db
				.delete(conversations)
				.where(eq(conversations.chatId, key));
			this.logger.info("Cleared conversation context", { chatId });
		} catch (error) {
			this.logger.error("Failed to clear conversation", {
				chatId,
				error: getErrorMessage(error),
			});
			throw error;
		}
	}

	private async cleanupExpiredConversations(): Promise<void> {
		try {
			const now = new Date().toISOString();
			await this.db
				.delete(conversations)
				.where(lt(conversations.expiresAt, now));
		} catch (error) {
			this.logger.warn("Failed to cleanup expired conversations", {
				error: getErrorMessage(error),
			});
		}
	}

	hasRecentTranscriptions(
		conversation: ConversationData,
		maxAgeMs = 30 * 60 * 1000,
	): boolean {
		if (!conversation.messages || conversation.messages.length === 0) {
			return false;
		}

		const now = Date.now();
		return conversation.messages.some((msg) => {
			if (msg.type !== "transcription") return false;
			const msgTime = new Date(msg.timestamp).getTime();
			return now - msgTime <= maxAgeMs;
		});
	}

	getContextForLLM(conversation: ConversationData, maxMessages = 10) {
		if (!conversation.messages || conversation.messages.length === 0) {
			return [];
		}

		return conversation.messages
			.slice(-maxMessages)
			.map((msg) => {
				switch (msg.type) {
					case "transcription":
						return {
							role: "user" as const,
							content: `[Audio Transcription]: ${msg.content}`,
						};
					case "user_message":
						return {
							role: "user" as const,
							content: msg.content,
						};
					case "bot_response":
						return {
							role: "assistant" as const,
							content: msg.content,
						};
					default:
						return null;
				}
			})
			.filter(
				(msg): msg is { role: "user" | "assistant"; content: string } =>
					msg !== null,
			);
	}
}
