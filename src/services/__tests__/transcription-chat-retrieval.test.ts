import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanupTestDb, createTestDb } from "@/test/db";
import { createTestLogger } from "@/test/setup";
import { TranscriptionChunksService } from "../transcription-chunks";
import { TranscriptionsService } from "../transcriptions";
import { TranscriptionChatRetrievalService } from "../transcription-chat-retrieval";

describe("TranscriptionChatRetrievalService", () => {
	let db: Awaited<ReturnType<typeof createTestDb>>;
	let transcriptionsService: TranscriptionsService;
	let chunksService: TranscriptionChunksService;
	let retrievalService: TranscriptionChatRetrievalService;

	beforeEach(async () => {
		db = await createTestDb();
		const logger = createTestLogger();
		transcriptionsService = new TranscriptionsService(db, logger);
		chunksService = new TranscriptionChunksService(db, logger);
		retrievalService = new TranscriptionChatRetrievalService(db, logger);
	});

	afterEach(async () => {
		await cleanupTestDb(db);
	});

	async function seedChunks(transcriptTexts: Array<string | null>) {
		const transcriptionId = await transcriptionsService.create({
			audioKey: "https://blob.example/audio.m4a",
			filename: "audio.m4a",
		});

		await chunksService.createMany(
			transcriptionId,
			transcriptTexts.map((_, chunkIndex) => ({
				chunkIndex,
				blobUrl: `https://blob.example/chunk-${chunkIndex}.m4a`,
				startMs: chunkIndex * 60_000,
				endMs: (chunkIndex + 1) * 60_000,
			})),
		);

		const chunks = await chunksService.findByTranscriptionId(transcriptionId);

		for (const [chunkIndex, transcriptText] of transcriptTexts.entries()) {
			if (transcriptText === null) continue;

			const chunk = chunks[chunkIndex];
			await chunksService.markCompleted(chunk.id, transcriptionId, transcriptText);
		}

		return transcriptionId;
	}

	it("ranks chunks by lexical overlap and boosts exact phrase matches", async () => {
		const transcriptionId = await seedChunks([
			"We should talk about the project timeline and the next steps.",
			"The project timeline and next steps are ready.",
			"Budget review only.",
		]);

		const results = await retrievalService.findRelevantChunks(
			transcriptionId,
			"project timeline and next steps",
			2,
		);

		expect(results).toHaveLength(2);
		expect(results[0]).toMatchObject({
			chunkIndex: 1,
			text: "The project timeline and next steps are ready.",
			startMs: 60_000,
			endMs: 120_000,
		});
		expect(results[1]).toMatchObject({
			chunkIndex: 0,
			text: "We should talk about the project timeline and the next steps.",
			startMs: 0,
			endMs: 60_000,
		});
		expect(results[0].score).toBeGreaterThan(results[1].score);
	});

	it("tokenizes Hebrew query and transcript text", async () => {
		const transcriptionId = await seedChunks([
			"דיברנו על פגישה-מחר בבוקר",
			"פגישה כללית אחרת",
			null,
		]);

		const results = await retrievalService.findRelevantChunks(
			transcriptionId,
			"פגישה מחר",
			2,
		);

		expect(results).toHaveLength(2);
		expect(results[0]).toMatchObject({
			chunkIndex: 0,
			text: "דיברנו על פגישה-מחר בבוקר",
		});
		expect(results[0].score).toBeGreaterThan(results[1].score);
		expect(results[1].text).toBe("פגישה כללית אחרת");
	});

	it("boosts a normalized phrase only at token boundaries", async () => {
		const transcriptionId = await seedChunks([
			"release-plan approved",
			"therelease plan approved",
			"unrelated follow up",
		]);

		const results = await retrievalService.findRelevantChunks(
			transcriptionId,
			"release plan",
			2,
		);

		expect(results).toHaveLength(2);
		expect(results[0]).toMatchObject({
			chunkIndex: 0,
			text: "release-plan approved",
		});
		expect(results[0].score).toBeGreaterThan(results[1].score);
		expect(results[1]).toMatchObject({
			chunkIndex: 1,
			text: "therelease plan approved",
		});
	});

	it("ignores chunks without transcript text", async () => {
		const transcriptionId = await seedChunks([
			null,
			"Discuss the rollout plan and launch timing.",
			null,
		]);

		const results = await retrievalService.findRelevantChunks(
			transcriptionId,
			"rollout plan",
			5,
		);

		expect(results).toHaveLength(1);
		expect(results[0]).toMatchObject({
			chunkIndex: 1,
			text: "Discuss the rollout plan and launch timing.",
		});
	});

	it("returns an empty list when no chunk text can be used", async () => {
		const transcriptionId = await seedChunks([null, null]);

		await expect(
			retrievalService.findRelevantChunks(
				transcriptionId,
				"anything useful",
				5,
			),
		).resolves.toEqual([]);
	});

	it("returns an empty list when chunk text shares zero normalized tokens with the query", async () => {
		const transcriptionId = await seedChunks(["foo bar", "baz qux"]);

		await expect(
			retrievalService.findRelevantChunks(transcriptionId, "unrelated query", 5),
		).resolves.toEqual([]);
	});

	it("falls back to transcriptText when no chunk transcripts are available", async () => {
		const transcriptionId = await transcriptionsService.create({
			audioKey: "https://blob.example/audio.m4a",
			filename: "audio.m4a",
		});

		await transcriptionsService.markCompleted(
			transcriptionId,
			"פגישה מחר בבוקר על התקציב",
			"פגישה מחר בבוקר על התקציב. הוחלט לאשר את התקציב ולהמשיך לשלב הבא.",
		);

		const results = await retrievalService.findRelevantChunks(
			transcriptionId,
			"מה אמרו על התקציב",
			3,
		);

		expect(results).toHaveLength(1);
		expect(results[0]).toMatchObject({
			chunkIndex: 0,
			startMs: 0,
			endMs: 0,
			text: "פגישה מחר בבוקר על התקציב. הוחלט לאשר את התקציב ולהמשיך לשלב הבא.",
		});
		expect(results[0].score).toBeGreaterThan(0);
	});

	it("limits oversized transcript fallback context to a bounded excerpt", async () => {
		const transcriptionId = await transcriptionsService.create({
			audioKey: "https://blob.example/audio.m4a",
			filename: "audio.m4a",
		});
		const transcriptText = `${"intro ".repeat(1_000)}budget decision approved${" outro".repeat(1_000)}`;

		await transcriptionsService.markCompleted(
			transcriptionId,
			"budget decision approved",
			transcriptText,
		);

		const results = await retrievalService.findRelevantChunks(
			transcriptionId,
			"budget decision",
			1,
		);

		expect(results).toHaveLength(1);
		expect(results[0].text.length).toBeLessThan(transcriptText.length);
		expect(results[0].text.length).toBeLessThanOrEqual(4_003);
		expect(results[0].text).toContain("budget decision approved");
	});

	it("returns at most the requested number of chunks with deterministic tie breaking", async () => {
		const transcriptionId = await seedChunks([
			"alpha beta gamma",
			"alpha beta delta",
			"alpha beta epsilon",
		]);

		const results = await retrievalService.findRelevantChunks(
			transcriptionId,
			"alpha beta",
			2,
		);

		expect(results).toHaveLength(2);
		expect(results.map((chunk) => chunk.chunkIndex)).toEqual([0, 1]);
		expect(results[0].score).toBe(results[1].score);
	});

	it("logs query metadata instead of raw user text when retrieval fails", async () => {
		const logger = {
			error: vi.fn(),
		};
		const failingService = new TranscriptionChatRetrievalService(
			{
				select: () => {
					throw new Error("db failed");
				},
			} as never,
			logger as never,
		);

		await expect(
			failingService.findRelevantChunks("tr_123", "secret budget question", 5),
		).rejects.toThrow("db failed");

		expect(logger.error).toHaveBeenCalledWith(
			"Failed to retrieve transcription chat chunks",
			expect.objectContaining({
				transcriptionId: "tr_123",
				limit: 5,
				queryLength: "secret budget question".length,
				queryTokenCount: 3,
				error: "db failed",
			}),
		);
		expect(logger.error.mock.calls[0][1]).not.toHaveProperty("latestUserQuery");
	});
});
