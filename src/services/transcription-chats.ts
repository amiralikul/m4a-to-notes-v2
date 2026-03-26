import { and, asc, desc, eq } from "drizzle-orm";
import {
	chatMessages,
	transcriptionChats,
	type TranscriptionChatMessagePart,
	type TranscriptionChatQuotedChunk,
} from "@/db/schema";
import type { AppDatabase } from "@/db/types";
import { getErrorMessage } from "@/lib/errors";
import type { Logger } from "@/lib/logger";

type TranscriptionChatRow = typeof transcriptionChats.$inferSelect;
type ChatMessageRow = typeof chatMessages.$inferSelect;
type TransactionRunner = <T>(
	callback: (tx: AppDatabase) => Promise<T>,
) => Promise<T>;

export class TranscriptionChatsService {
	constructor(
		private db: AppDatabase,
		private logger: Logger,
	) {}

	async getOrCreateForTranscriptionAndUser(
		transcriptionId: string,
		userId: string,
	): Promise<TranscriptionChatRow> {
		try {
			const existingChat = await this.db
				.select()
				.from(transcriptionChats)
				.where(
					and(
						eq(transcriptionChats.transcriptionId, transcriptionId),
						eq(transcriptionChats.userId, userId),
					),
				)
				.limit(1);

			if (existingChat[0]) {
				return existingChat[0];
			}

			const now = new Date().toISOString();
			const chatId = crypto.randomUUID();

			await this.db.insert(transcriptionChats).values({
				id: chatId,
				transcriptionId,
				userId,
				createdAt: now,
				updatedAt: now,
			}).onConflictDoNothing({
				target: [transcriptionChats.transcriptionId, transcriptionChats.userId],
			});

			const resolvedChat = await this.db
				.select()
				.from(transcriptionChats)
				.where(
					and(
						eq(transcriptionChats.transcriptionId, transcriptionId),
						eq(transcriptionChats.userId, userId),
					),
				)
				.limit(1);

			if (!resolvedChat[0]) {
				throw new Error("Failed to create transcription chat");
			}

			return resolvedChat[0];
		} catch (error) {
			this.logger.error("Failed to get or create transcription chat", {
				transcriptionId,
				userId,
				error: getErrorMessage(error),
			});
			throw error;
		}
	}

	async listMessages(chatId: string): Promise<ChatMessageRow[]> {
		try {
			return await this.db
				.select()
				.from(chatMessages)
				.where(eq(chatMessages.chatId, chatId))
				.orderBy(asc(chatMessages.createdAt), asc(chatMessages.id));
		} catch (error) {
			this.logger.error("Failed to list transcription chat messages", {
				chatId,
				error: getErrorMessage(error),
			});
			throw error;
		}
	}

	async appendUserMessage(
		chatId: string,
		parts: TranscriptionChatMessagePart[],
	): Promise<ChatMessageRow> {
		return this.appendMessage(chatId, "user", parts);
	}

	async appendAssistantMessage(
		chatId: string,
		parts: TranscriptionChatMessagePart[],
		quotedChunks?: TranscriptionChatQuotedChunk[],
	): Promise<ChatMessageRow> {
		return this.appendMessage(chatId, "assistant", parts, quotedChunks ?? null);
	}

	async replaceLatestAssistantMessage(
		chatId: string,
		parts: TranscriptionChatMessagePart[],
		quotedChunks?: TranscriptionChatQuotedChunk[],
	): Promise<ChatMessageRow> {
		try {
			const now = new Date().toISOString();
			const runTransaction = this.getTransactionRunner();

			return await runTransaction(async (tx) => {
				const latestAssistantRows = await tx
					.select()
					.from(chatMessages)
					.where(
						and(
							eq(chatMessages.chatId, chatId),
							eq(chatMessages.role, "assistant"),
						),
					)
					.orderBy(desc(chatMessages.createdAt), desc(chatMessages.id))
					.limit(1);

				const latestAssistantMessage = latestAssistantRows[0] ?? null;
				const replacementMessageId = crypto.randomUUID();

				await tx.insert(chatMessages).values({
					id: replacementMessageId,
					chatId,
					role: "assistant",
					parts,
					quotedChunks: quotedChunks ?? null,
					createdAt: now,
				});

				if (latestAssistantMessage) {
					await tx
						.delete(chatMessages)
						.where(eq(chatMessages.id, latestAssistantMessage.id));
				}

				await tx
					.update(transcriptionChats)
					.set({ updatedAt: now })
					.where(eq(transcriptionChats.id, chatId));

				const insertedRows = await tx
					.select()
					.from(chatMessages)
					.where(eq(chatMessages.id, replacementMessageId))
					.limit(1);

				if (!insertedRows[0]) {
					throw new Error("Failed to replace transcription chat assistant message");
				}

				return insertedRows[0];
			});
		} catch (error) {
			this.logger.error("Failed to replace latest assistant transcription chat message", {
				chatId,
				error: getErrorMessage(error),
			});
			throw error;
		}
	}

	private async appendMessage(
		chatId: string,
		role: "user" | "assistant",
		parts: TranscriptionChatMessagePart[],
		quotedChunks: TranscriptionChatQuotedChunk[] | null = null,
	): Promise<ChatMessageRow> {
		try {
			const now = new Date().toISOString();
			const runTransaction = this.getTransactionRunner();

			const insertedMessage = await runTransaction(async (tx) => {
				const messageId = crypto.randomUUID();

				await tx.insert(chatMessages).values({
					id: messageId,
					chatId,
					role,
					parts,
					quotedChunks,
					createdAt: now,
				});

				await tx
					.update(transcriptionChats)
					.set({ updatedAt: now })
					.where(eq(transcriptionChats.id, chatId));

				const rows = await tx
					.select()
					.from(chatMessages)
					.where(eq(chatMessages.id, messageId))
					.limit(1);

				if (!rows[0]) {
					throw new Error("Failed to create transcription chat message");
				}

				return rows[0];
			});

			return insertedMessage;
		} catch (error) {
			this.logger.error("Failed to append transcription chat message", {
				chatId,
				role,
				error: getErrorMessage(error),
			});
			throw error;
		}
	}

	private getTransactionRunner(): TransactionRunner {
		return this.db.transaction.bind(this.db) as unknown as TransactionRunner;
	}
}
