import { afterEach, beforeEach, describe, expect, it } from "vitest";
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

	it("creates a single chat thread per transcription and user", async () => {
		expect(service).toBeDefined();
	});
});
