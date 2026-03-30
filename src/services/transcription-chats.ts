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
		messageId?: string,
	): Promise<ChatMessageRow> {
		return this.appendMessage(chatId, "user", parts, null, messageId);
	}

	async appendAssistantMessage(
		chatId: string,
		parts: TranscriptionChatMessagePart[],
		quotedChunks?: TranscriptionChatQuotedChunk[],
		messageId?: string,
	): Promise<ChatMessageRow> {
		return this.appendMessage(
			chatId,
			"assistant",
			parts,
			quotedChunks ?? null,
			messageId,
		);
	}

	async replaceLatestAssistantMessage(
		chatId: string,
		parts: TranscriptionChatMessagePart[],
		quotedChunks?: TranscriptionChatQuotedChunk[],
		messageId?: string,
	): Promise<ChatMessageRow> {
		try {
			const now = new Date().toISOString();
			const runTransaction = this.getTransactionRunner();

			return await runTransaction(async (tx) => {
				const replacementMessageId = messageId ?? crypto.randomUUID();

				if (messageId) {
					const existingMessage = await this.findMessageById(
						tx,
						replacementMessageId,
					);
					if (existingMessage) {
						this.assertMessageIdentity(existingMessage, {
							chatId,
							role: "assistant",
						});
						return existingMessage;
					}
				}

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

				await this.insertMessage(tx, {
					id: replacementMessageId,
					chatId,
					role: "assistant",
					parts,
					quotedChunks: quotedChunks ?? null,
					createdAt: now,
				});

				if (
					latestAssistantMessage &&
					latestAssistantMessage.id !== replacementMessageId
				) {
					await tx
						.delete(chatMessages)
						.where(eq(chatMessages.id, latestAssistantMessage.id));
				}

				await tx
					.update(transcriptionChats)
					.set({ updatedAt: now })
					.where(eq(transcriptionChats.id, chatId));

				const insertedMessage = await this.findMessageById(
					tx,
					replacementMessageId,
				);

				if (!insertedMessage) {
					throw new Error("Failed to replace transcription chat assistant message");
				}

				this.assertMessageIdentity(insertedMessage, {
					chatId,
					role: "assistant",
				});

				return insertedMessage;
			});
		} catch (error) {
			this.logger.error("Failed to replace latest assistant transcription chat message", {
				chatId,
				error: getErrorMessage(error),
			});
			throw error;
		}
	}

	async clearMessages(chatId: string): Promise<void> {
		try {
			const now = new Date().toISOString();
			const runTransaction = this.getTransactionRunner();

			await runTransaction(async (tx) => {
				await tx.delete(chatMessages).where(eq(chatMessages.chatId, chatId));
				await tx
					.update(transcriptionChats)
					.set({ updatedAt: now })
					.where(eq(transcriptionChats.id, chatId));
			});
		} catch (error) {
			this.logger.error("Failed to clear transcription chat messages", {
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
		messageId?: string,
	): Promise<ChatMessageRow> {
		try {
			const now = new Date().toISOString();
			const runTransaction = this.getTransactionRunner();

			const insertedMessage = await runTransaction(async (tx) => {
				const persistedMessageId = messageId ?? crypto.randomUUID();

				if (messageId) {
					const existingMessage = await this.findMessageById(tx, persistedMessageId);
					if (existingMessage) {
						this.assertMessageIdentity(existingMessage, { chatId, role });
						return existingMessage;
					}
				}

				await this.insertMessage(tx, {
					id: persistedMessageId,
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

				const insertedRow = await this.findMessageById(tx, persistedMessageId);

				if (!insertedRow) {
					throw new Error("Failed to create transcription chat message");
				}

				this.assertMessageIdentity(insertedRow, { chatId, role });

				return insertedRow;
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

	private async insertMessage(
		tx: AppDatabase,
		message: typeof chatMessages.$inferInsert,
	): Promise<void> {
		await tx.insert(chatMessages).values(message).onConflictDoNothing();
	}

	private async findMessageById(
		tx: AppDatabase,
		messageId: string,
	): Promise<ChatMessageRow | null> {
		const rows = await tx
			.select()
			.from(chatMessages)
			.where(eq(chatMessages.id, messageId))
			.limit(1);

		return rows[0] ?? null;
	}

	private assertMessageIdentity(
		message: ChatMessageRow,
		expected: { chatId: string; role: "user" | "assistant" },
	): void {
		if (
			message.chatId !== expected.chatId ||
			message.role !== expected.role
		) {
			throw new Error("Chat message ID already exists for a different message");
		}
	}
}
