import { asc, eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { chatMessages } from "@/db/schema";
import {
	transcriptionChats,
	transcriptions,
	users,
} from "@/db/schema";
import { cleanupTestDb, createTestDb } from "@/test/db";
import { createTestLogger } from "@/test/setup";
import { TranscriptionChatsService } from "../transcription-chats";

describe("TranscriptionChatsService", () => {
	let db: Awaited<ReturnType<typeof createTestDb>>;
	let service: TranscriptionChatsService;

	beforeEach(async () => {
		db = await createTestDb();
		const logger = createTestLogger();
		service = new TranscriptionChatsService(db, logger);
	});

	afterEach(async () => {
		await cleanupTestDb(db);
	});

	async function seedTranscriptionAndUsers() {
		const now = new Date();
		const transcriptionId = crypto.randomUUID();
		const userId = crypto.randomUUID();
		const otherUserId = crypto.randomUUID();

		await db.insert(users).values([
			{
				id: userId,
				name: "Test User",
				email: "user@example.com",
				emailVerified: false,
				createdAt: now,
				updatedAt: now,
			},
			{
				id: otherUserId,
				name: "Other User",
				email: "other@example.com",
				emailVerified: false,
				createdAt: now,
				updatedAt: now,
			},
		]);
		await db.insert(transcriptions).values({
			id: transcriptionId,
			status: "completed",
			progress: 100,
			audioKey: "blob://audio.m4a",
			filename: "audio.m4a",
			source: "web",
			createdAt: now.toISOString(),
			updatedAt: now.toISOString(),
		});

		return { transcriptionId, userId, otherUserId };
	}

	it("reuses one chat row for the same transcription and user", async () => {
		const { transcriptionId, userId, otherUserId } =
			await seedTranscriptionAndUsers();

		const firstChat = await service.getOrCreateForTranscriptionAndUser(
			transcriptionId,
			userId,
		);
		const secondChat = await service.getOrCreateForTranscriptionAndUser(
			transcriptionId,
			userId,
		);
		const otherUserChat = await service.getOrCreateForTranscriptionAndUser(
			transcriptionId,
			otherUserId,
		);

		expect(secondChat.id).toBe(firstChat.id);
		expect(secondChat.transcriptionId).toBe(transcriptionId);
		expect(secondChat.userId).toBe(userId);
		expect(otherUserChat.id).not.toBe(firstChat.id);

		const chatRows = await db
			.select()
			.from(transcriptionChats)
			.where(eq(transcriptionChats.transcriptionId, transcriptionId));
		expect(chatRows).toHaveLength(2);
		expect(chatRows.map((row) => row.userId).sort()).toEqual(
			[userId, otherUserId].sort(),
		);
	});

	it("appends user and assistant messages and lists them in chronological order", async () => {
		const { transcriptionId, userId } = await seedTranscriptionAndUsers();
		const chat = await service.getOrCreateForTranscriptionAndUser(
			transcriptionId,
			userId,
		);

		const userMessage = await service.appendUserMessage(chat.id, [
			{ type: "text", text: "What does the transcript say?" },
		]);
		await new Promise((resolve) => setTimeout(resolve, 5));
		const assistantMessage = await service.appendAssistantMessage(
			chat.id,
			[
				{ type: "text", text: "It summarizes the recording." },
			],
			[
				{
					chunkId: "chunk-1",
					startMs: 1200,
					endMs: 3400,
					text: "It summarizes the recording.",
				},
			],
		);

		const storedRows = await db
			.select()
			.from(chatMessages)
			.where(eq(chatMessages.chatId, chat.id))
			.orderBy(asc(chatMessages.createdAt), asc(chatMessages.id));

		expect(storedRows).toHaveLength(2);
		expect(storedRows[0].role).toBe("user");
		expect(storedRows[0].parts).toEqual([
			{ type: "text", text: "What does the transcript say?" },
		]);
		expect(storedRows[0].quotedChunks).toBeNull();
		expect(storedRows[1].role).toBe("assistant");
		expect(storedRows[1].parts).toEqual([
			{ type: "text", text: "It summarizes the recording." },
		]);
		expect(storedRows[1].quotedChunks).toEqual([
			{
				chunkId: "chunk-1",
				startMs: 1200,
				endMs: 3400,
				text: "It summarizes the recording.",
			},
		]);

		const listedMessages = await service.listMessages(chat.id);
		expect(listedMessages).toHaveLength(2);
		expect(listedMessages.map((message) => message.id)).toEqual([
			userMessage.id,
			assistantMessage.id,
		]);
		expect(listedMessages.map((message) => message.role)).toEqual([
			"user",
			"assistant",
		]);
	});

	it("reuses caller-provided message ids for appends and retries", async () => {
		const { transcriptionId, userId } = await seedTranscriptionAndUsers();
		const chat = await service.getOrCreateForTranscriptionAndUser(
			transcriptionId,
			userId,
		);

		const userMessage = await (service as never as {
			appendUserMessage: (
				chatId: string,
				parts: Array<{ type: string; text: string }>,
				messageId: string,
			) => Promise<{ id: string }>;
		}).appendUserMessage(
			chat.id,
			[{ type: "text", text: "What does the transcript say?" }],
			"msg_user_known",
		);
		const retriedUserMessage = await (service as never as {
			appendUserMessage: (
				chatId: string,
				parts: Array<{ type: string; text: string }>,
				messageId: string,
			) => Promise<{ id: string; parts: Array<{ type: string; text: string }> }>;
		}).appendUserMessage(
			chat.id,
			[{ type: "text", text: "This retry should not create a duplicate." }],
			"msg_user_known",
		);
		const assistantMessage = await (service as never as {
			appendAssistantMessage: (
				chatId: string,
				parts: Array<{ type: string; text: string }>,
				quotedChunks: null,
				messageId: string,
			) => Promise<{ id: string }>;
		}).appendAssistantMessage(
			chat.id,
			[{ type: "text", text: "It summarizes the recording." }],
			null,
			"msg_assistant_known",
		);
		const retriedAssistantMessage = await (service as never as {
			appendAssistantMessage: (
				chatId: string,
				parts: Array<{ type: string; text: string }>,
				quotedChunks: null,
				messageId: string,
			) => Promise<{ id: string; parts: Array<{ type: string; text: string }> }>;
		}).appendAssistantMessage(
			chat.id,
			[{ type: "text", text: "This retry should also reuse the same row." }],
			null,
			"msg_assistant_known",
		);

		const listedMessages = await service.listMessages(chat.id);

		expect(userMessage.id).toBe("msg_user_known");
		expect(retriedUserMessage.id).toBe("msg_user_known");
		expect(retriedUserMessage.parts).toEqual([
			{ type: "text", text: "What does the transcript say?" },
		]);
		expect(assistantMessage.id).toBe("msg_assistant_known");
		expect(retriedAssistantMessage.id).toBe("msg_assistant_known");
		expect(retriedAssistantMessage.parts).toEqual([
			{ type: "text", text: "It summarizes the recording." },
		]);
		expect(listedMessages).toHaveLength(2);
		expect(listedMessages.map((message) => message.id)).toEqual([
			"msg_user_known",
			"msg_assistant_known",
		]);
	});

	it("keeps chats and messages isolated across users", async () => {
		const { transcriptionId, userId, otherUserId } =
			await seedTranscriptionAndUsers();

		const userChat = await service.getOrCreateForTranscriptionAndUser(
			transcriptionId,
			userId,
		);
		const otherChat = await service.getOrCreateForTranscriptionAndUser(
			transcriptionId,
			otherUserId,
		);

		await service.appendUserMessage(userChat.id, [
			{ type: "text", text: "User one question" },
		]);

		const userMessages = await service.listMessages(userChat.id);
		const otherMessages = await service.listMessages(otherChat.id);

		expect(userChat.id).not.toBe(otherChat.id);
		expect(userMessages).toHaveLength(1);
		expect(otherMessages).toHaveLength(0);
		expect(userMessages[0].parts).toEqual([
			{ type: "text", text: "User one question" },
		]);
	});

	it("replaces the latest assistant message atomically and keeps the original on insert failure", async () => {
		const { transcriptionId, userId, otherUserId } =
			await seedTranscriptionAndUsers();
		const chat = await service.getOrCreateForTranscriptionAndUser(
			transcriptionId,
			userId,
		);
		const otherChat = await service.getOrCreateForTranscriptionAndUser(
			transcriptionId,
			otherUserId,
		);

		await service.appendUserMessage(chat.id, [
			{ type: "text", text: "What changed?" },
		]);
		const originalAssistant = await service.appendAssistantMessage(chat.id, [
			{ type: "text", text: "Original answer." },
		]);

		const replacedAssistant = await service.replaceLatestAssistantMessage(
			chat.id,
			[{ type: "text", text: "Replacement answer." }],
			[
				{
					chunkId: "chunk-1",
					startMs: 1000,
					endMs: 2000,
					text: "Replacement answer.",
				},
			],
			"msg_assistant_replacement",
		);

		const rowsAfterReplace = await service.listMessages(chat.id);
		expect(replacedAssistant?.id).toBe("msg_assistant_replacement");
		expect(replacedAssistant?.id).not.toBe(originalAssistant.id);
		expect(rowsAfterReplace).toHaveLength(2);
		expect(rowsAfterReplace[1].id).toBe(replacedAssistant?.id);
		expect(rowsAfterReplace[1].parts).toEqual([
			{ type: "text", text: "Replacement answer." },
		]);
		expect(rowsAfterReplace[1].quotedChunks).toEqual([
			{
				chunkId: "chunk-1",
				startMs: 1000,
				endMs: 2000,
				text: "Replacement answer.",
			},
		]);

		const conflictingAssistant = await service.appendAssistantMessage(otherChat.id, [
			{ type: "text", text: "Other chat answer." },
		]);

		const randomUuidSpy = vi
			.spyOn(crypto, "randomUUID")
			.mockReturnValue(conflictingAssistant.id);

		try {
			await expect(
				service.replaceLatestAssistantMessage(chat.id, [
					{ type: "text", text: "Broken replacement" },
				]),
			).rejects.toThrow();
		} finally {
			randomUuidSpy.mockRestore();
		}

		const rowsAfterFailedReplace = await service.listMessages(chat.id);
		expect(rowsAfterFailedReplace).toHaveLength(2);
		expect(rowsAfterFailedReplace[1].id).toBe(replacedAssistant?.id);
		expect(rowsAfterFailedReplace[1].parts).toEqual([
			{ type: "text", text: "Replacement answer." },
		]);
	});

	it("clears all persisted messages while keeping the chat row", async () => {
		const { transcriptionId, userId } = await seedTranscriptionAndUsers();
		const chat = await service.getOrCreateForTranscriptionAndUser(
			transcriptionId,
			userId,
		);

		await service.appendUserMessage(chat.id, [
			{ type: "text", text: "First question" },
		]);
		await service.appendAssistantMessage(chat.id, [
			{ type: "text", text: "First answer" },
		]);

		await service.clearMessages(chat.id);

		const messageRows = await db
			.select()
			.from(chatMessages)
			.where(eq(chatMessages.chatId, chat.id));
		const chatRows = await db
			.select()
			.from(transcriptionChats)
			.where(eq(transcriptionChats.id, chat.id));

		expect(messageRows).toHaveLength(0);
		expect(chatRows).toHaveLength(1);
		expect(await service.listMessages(chat.id)).toEqual([]);
	});
});
