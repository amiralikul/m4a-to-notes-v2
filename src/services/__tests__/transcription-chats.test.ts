import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
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

	it("reuses one chat row for the same transcription and user", async () => {
		const now = new Date();
		const transcriptionId = crypto.randomUUID();
		const userId = crypto.randomUUID();
		const otherUserId = crypto.randomUUID();

		await db.insert(users).values({
			id: userId,
			name: "Test User",
			email: "user@example.com",
			emailVerified: false,
			createdAt: now,
			updatedAt: now,
		});
		await db.insert(users).values({
			id: otherUserId,
			name: "Other User",
			email: "other@example.com",
			emailVerified: false,
			createdAt: now,
			updatedAt: now,
		});
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
		expect(chatRows.map((row) => row.userId).sort()).toEqual([
			otherUserId,
			userId,
		]);
	});
});
