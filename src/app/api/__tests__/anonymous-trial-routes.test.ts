import { beforeEach, describe, expect, it, vi } from "vitest";
import { handleUpload } from "@vercel/blob/client";
import { TRIAL_ERROR_CODES } from "@/lib/trial-errors";
import { getServerSession } from "@/lib/auth-server";
import { getUtcDayKey, resolveActorIdentity } from "@/lib/trial-identity";
import {
	actorsService,
	transcriptionChunksService,
	transcriptionsService,
	trialUsageService,
	workflowService,
} from "@/services";
import { GET as getTranscriptionStatus } from "../../api/transcriptions/[transcriptionId]/route";
import { GET as getTranscript } from "../../api/transcriptions/[transcriptionId]/transcript/route";
import { POST as startTranscription } from "../../api/start-transcription/route";
import { POST as uploadRoute } from "../../api/upload/route";

vi.mock("@/lib/auth-server", () => ({
	getServerSession: vi.fn().mockResolvedValue(null),
}));

vi.mock("@vercel/blob/client", () => ({
	handleUpload: vi.fn().mockResolvedValue({ ok: true }),
}));

vi.mock("@/lib/trial-identity", () => ({
	resolveActorIdentity: vi.fn().mockResolvedValue({ actorId: "actor-1" }),
	getUtcDayKey: vi.fn().mockReturnValue("2026-02-16"),
	TRIAL_DAILY_LIMIT: 3,
}));

vi.mock("@/services", () => ({
	actorsService: {
		ensureActor: vi.fn().mockResolvedValue(undefined),
		getOrCreateForUser: vi.fn(),
	},
	transcriptionsService: {
		create: vi.fn().mockResolvedValue("tr-1"),
		findById: vi.fn(),
		findByIdForOwner: vi.fn(),
		getStatusForOwner: vi.fn(),
	},
	transcriptionChunksService: {
		createMany: vi.fn().mockResolvedValue(undefined),
	},
	trialUsageService: {
		getRemaining: vi.fn().mockResolvedValue(3),
		consumeSlot: vi.fn().mockResolvedValue(true),
	},
	workflowService: {
		startTranscription: vi.fn().mockResolvedValue(undefined),
	},
}));

vi.mock("@/lib/logger", () => ({
	logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

describe("Anonymous trial routes", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(getServerSession).mockResolvedValue(null);
		vi.mocked(resolveActorIdentity).mockResolvedValue({ actorId: "actor-1" });
		vi.mocked(actorsService.ensureActor).mockResolvedValue(undefined);
		vi.mocked(getUtcDayKey).mockReturnValue("2026-02-16");
		vi.mocked(trialUsageService.getRemaining).mockResolvedValue(3);
		vi.mocked(trialUsageService.consumeSlot).mockResolvedValue(true);
		vi.mocked(transcriptionsService.create).mockResolvedValue("tr-1");
		vi.mocked(transcriptionChunksService.createMany).mockResolvedValue(
			undefined,
		);
	});

	it("allows anonymous upload token creation when quota remains", async () => {
		const request = new Request("http://localhost:3000/api/upload", {
			method: "POST",
			body: JSON.stringify({ filename: "a.m4a" }),
			headers: { "Content-Type": "application/json" },
		});

		const response = await uploadRoute(request);

		expect(response.status).toBe(200);
		expect(trialUsageService.getRemaining).toHaveBeenCalledWith(
			"actor-1",
			"2026-02-16",
		);
		expect(actorsService.ensureActor).toHaveBeenCalledWith("actor-1");
		expect(handleUpload).toHaveBeenCalledOnce();
	});

	it("allows anonymous start-transcription for first three requests and blocks fourth", async () => {
		let attempts = 0;
		vi.mocked(trialUsageService.consumeSlot).mockImplementation(async () => {
			attempts += 1;
			return attempts <= 3;
		});

		const responses: Response[] = [];
		const statuses: number[] = [];

		for (let i = 0; i < 4; i++) {
			const request = new Request(
				"http://localhost:3000/api/start-transcription",
				{
					method: "POST",
					body: JSON.stringify({
						blobUrl: "https://blob.test/audio.m4a",
						filename: "audio.m4a",
					}),
					headers: { "Content-Type": "application/json" },
				},
			);

			const response = await startTranscription(request);
			responses.push(response);
			statuses.push(response.status);
		}

		expect(statuses).toEqual([201, 201, 201, 429]);
		expect(transcriptionsService.create).toHaveBeenCalledTimes(3);
		expect(workflowService.startTranscription).toHaveBeenCalledTimes(3);
		expect(transcriptionsService.create).toHaveBeenCalledWith(
			expect.objectContaining({
				userId: undefined,
				ownerId: "actor-1",
				userMetadata: expect.objectContaining({ actorId: "actor-1" }),
			}),
		);

		const fourthBody = await responses[3].json();
		expect(fourthBody.code).toBe(TRIAL_ERROR_CODES.DAILY_LIMIT_REACHED);
	});

	it("starts chunked transcription and persists chunk manifest", async () => {
		const request = new Request("http://localhost:3000/api/start-transcription", {
			method: "POST",
			body: JSON.stringify({
				filename: "big-audio.m4a",
				chunks: [
					{
						chunkIndex: 0,
						blobUrl: "https://blob.test/chunk-0.m4a",
						startMs: 0,
						endMs: 600000,
					},
					{
						chunkIndex: 1,
						blobUrl: "https://blob.test/chunk-1.m4a",
						startMs: 590000,
						endMs: 1200000,
					},
				],
			}),
			headers: { "Content-Type": "application/json" },
		});

		const response = await startTranscription(request);

		expect(response.status).toBe(201);
		expect(transcriptionsService.create).toHaveBeenCalledWith(
			expect.objectContaining({
				audioKey: "https://blob.test/chunk-0.m4a",
				userMetadata: expect.objectContaining({
					uploadMode: "chunked",
					chunkCount: 2,
				}),
			}),
		);
		expect(transcriptionChunksService.createMany).toHaveBeenCalledWith(
			"tr-1",
			expect.arrayContaining([
				expect.objectContaining({ chunkIndex: 0 }),
				expect.objectContaining({ chunkIndex: 1 }),
			]),
		);
		expect(workflowService.startTranscription).toHaveBeenCalledWith("tr-1");
	});

	it("returns 429 for anonymous upload when daily quota is exhausted", async () => {
		vi.mocked(trialUsageService.getRemaining).mockResolvedValue(0);

		const request = new Request("http://localhost:3000/api/upload", {
			method: "POST",
			body: JSON.stringify({ filename: "a.m4a" }),
			headers: { "Content-Type": "application/json" },
		});

		const response = await uploadRoute(request);
		const body = await response.json();

		expect(response.status).toBe(429);
		expect(body.error).toContain("Daily free limit reached");
		expect(body.code).toBe(TRIAL_ERROR_CODES.DAILY_LIMIT_REACHED);
		expect(handleUpload).not.toHaveBeenCalled();
	});

	it("allows anonymous user to poll only own transcription status", async () => {
		vi.mocked(transcriptionsService.getStatusForOwner).mockResolvedValue({
			status: "processing",
			progress: 50,
		} as never);

		const ownResponse = await getTranscriptionStatus(new Request("http://x"), {
			params: Promise.resolve({ transcriptionId: "tr-1" }),
		});
		expect(ownResponse.status).toBe(200);

		vi.mocked(transcriptionsService.getStatusForOwner).mockResolvedValue(null);
		const otherResponse = await getTranscriptionStatus(new Request("http://x"), {
			params: Promise.resolve({ transcriptionId: "tr-2" }),
		});
		expect(otherResponse.status).toBe(404);
	});

	it("allows anonymous user to fetch transcript only for own job", async () => {
		vi.mocked(transcriptionsService.findByIdForOwner).mockResolvedValue({
			id: "tr-1",
			filename: "meeting.m4a",
			userId: null,
			ownerId: "actor-1",
			transcriptText: "transcript body",
		} as never);

		const ownResponse = await getTranscript(new Request("http://x"), {
			params: Promise.resolve({ transcriptionId: "tr-1" }),
		});
		expect(ownResponse.status).toBe(200);
		expect(await ownResponse.text()).toContain("transcript body");

		vi.mocked(transcriptionsService.findByIdForOwner).mockResolvedValue(null);

		const otherResponse = await getTranscript(new Request("http://x"), {
			params: Promise.resolve({ transcriptionId: "tr-2" }),
		});
		expect(otherResponse.status).toBe(404);
	});
});
