import { describe, it, expect, beforeEach } from "vitest";
import { createTestDb } from "@/test/db";
import { createTestLogger } from "@/test/setup";
import { TranscriptionsService, TranscriptionStatus } from "../transcriptions";

describe("TranscriptionsService", () => {
	let service: TranscriptionsService;

	beforeEach(() => {
		const db = createTestDb();
		const logger = createTestLogger();
		service = new TranscriptionsService(db, logger);
	});

	describe("create", () => {
		it("creates a transcription with pending status", async () => {
			const id = await service.create({
				audioKey: "blob://test-audio.m4a",
				filename: "test.m4a",
				source: "web",
			});

			expect(id).toBeDefined();
			expect(typeof id).toBe("string");

			const transcription = await service.findById(id);
			expect(transcription).not.toBeNull();
			expect(transcription!.status).toBe(TranscriptionStatus.PENDING);
			expect(transcription!.progress).toBe(0);
			expect(transcription!.filename).toBe("test.m4a");
			expect(transcription!.source).toBe("web");
		});

		it("creates a telegram-source transcription", async () => {
			const id = await service.create({
				audioKey: "blob://telegram-audio.m4a",
				filename: "voice.m4a",
				source: "telegram",
				userMetadata: { chatId: "12345" },
			});

			const transcription = await service.findById(id);
			expect(transcription!.source).toBe("telegram");
			expect(transcription!.userMetadata).toEqual({ chatId: "12345" });
		});
	});

	describe("findById", () => {
		it("returns null for non-existent transcription", async () => {
			const result = await service.findById("non-existent-id");
			expect(result).toBeNull();
		});
	});

	describe("status transitions", () => {
		it("transitions pending → processing → completed", async () => {
			const id = await service.create({
				audioKey: "blob://test.m4a",
				filename: "test.m4a",
			});

			await service.markStarted(id, 5);
			let t = await service.findById(id);
			expect(t!.status).toBe(TranscriptionStatus.PROCESSING);
			expect(t!.progress).toBe(5);
			expect(t!.startedAt).toBeDefined();

			await service.updateProgress(id, 50);
			t = await service.findById(id);
			expect(t!.progress).toBe(50);

			await service.markCompleted(id, "Preview text...", "Full transcript text here");
			t = await service.findById(id);
			expect(t!.status).toBe(TranscriptionStatus.COMPLETED);
			expect(t!.progress).toBe(100);
			expect(t!.transcriptText).toBe("Full transcript text here");
			expect(t!.preview).toBe("Preview text...");
			expect(t!.completedAt).toBeDefined();
		});

		it("transitions pending → failed", async () => {
			const id = await service.create({
				audioKey: "blob://test.m4a",
				filename: "test.m4a",
			});

			await service.markFailed(id, "OPENAI_API_ERROR", "API rate limited");
			const t = await service.findById(id);
			expect(t!.status).toBe(TranscriptionStatus.FAILED);
			expect(t!.errorDetails).toEqual({
				code: "OPENAI_API_ERROR",
				message: "API rate limited",
			});
			expect(t!.completedAt).toBeDefined();
		});
	});

	describe("getStatus", () => {
		it("returns client-friendly status object", async () => {
			const id = await service.create({
				audioKey: "blob://test.m4a",
				filename: "report.m4a",
			});

			const status = await service.getStatus(id);
			expect(status).not.toBeNull();
			expect(status!.transcriptionId).toBe(id);
			expect(status!.jobId).toBe(id);
			expect(status!.status).toBe("pending");
			expect(status!.filename).toBe("report.m4a");
		});

		it("returns null for non-existent transcription", async () => {
			const status = await service.getStatus("non-existent");
			expect(status).toBeNull();
		});
	});

	describe("findByStatus", () => {
		it("finds transcriptions by status", async () => {
			await service.create({ audioKey: "a1", filename: "a.m4a" });
			await service.create({ audioKey: "a2", filename: "b.m4a" });

			const pending = await service.findByStatus(TranscriptionStatus.PENDING);
			expect(pending).toHaveLength(2);

			const completed = await service.findByStatus(TranscriptionStatus.COMPLETED);
			expect(completed).toHaveLength(0);
		});
	});

	describe("create with userId", () => {
		it("stores userId in the column", async () => {
			const id = await service.create({
				audioKey: "blob://test.m4a",
				filename: "test.m4a",
				userId: "user_123",
			});

			const transcription = await service.findById(id);
			expect(transcription!.userId).toBe("user_123");
		});

		it("leaves userId null when not provided", async () => {
			const id = await service.create({
				audioKey: "blob://test.m4a",
				filename: "test.m4a",
			});

			const transcription = await service.findById(id);
			expect(transcription!.userId).toBeNull();
		});
	});

	describe("findByUserId", () => {
		it("returns only that user's transcriptions", async () => {
			await service.create({
				audioKey: "a1",
				filename: "a.m4a",
				userId: "user_1",
			});
			await service.create({
				audioKey: "a2",
				filename: "b.m4a",
				userId: "user_1",
			});
			await service.create({
				audioKey: "a3",
				filename: "c.m4a",
				userId: "user_2",
			});

			const results = await service.findByUserId("user_1");
			expect(results).toHaveLength(2);
			expect(results.every((t) => t.userId === "user_1")).toBe(true);
		});

		it("returns empty array for unknown user", async () => {
			await service.create({
				audioKey: "a1",
				filename: "a.m4a",
				userId: "user_1",
			});

			const results = await service.findByUserId("unknown_user");
			expect(results).toHaveLength(0);
		});

		it("respects limit parameter", async () => {
			for (let i = 0; i < 5; i++) {
				await service.create({
					audioKey: `a${i}`,
					filename: `${i}.m4a`,
					userId: "user_1",
				});
			}

			const results = await service.findByUserId("user_1", 3);
			expect(results).toHaveLength(3);
		});
	});

	describe("countByUserId", () => {
		it("returns correct count", async () => {
			await service.create({
				audioKey: "a1",
				filename: "a.m4a",
				userId: "user_1",
			});
			await service.create({
				audioKey: "a2",
				filename: "b.m4a",
				userId: "user_1",
			});
			await service.create({
				audioKey: "a3",
				filename: "c.m4a",
				userId: "user_2",
			});

			expect(await service.countByUserId("user_1")).toBe(2);
			expect(await service.countByUserId("user_2")).toBe(1);
			expect(await service.countByUserId("unknown")).toBe(0);
		});
	});

	describe("delete", () => {
		it("deletes a transcription", async () => {
			const id = await service.create({
				audioKey: "blob://test.m4a",
				filename: "test.m4a",
			});

			await service.delete(id);
			const result = await service.findById(id);
			expect(result).toBeNull();
		});
	});
});
