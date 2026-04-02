import { beforeEach, describe, expect, it, vi } from "vitest";
import { getServerSession } from "@/lib/auth-server";
import { resolveActorIdentity } from "@/lib/trial-identity";
import { actorsService, transcriptionsService, translationsService } from "@/services";
import { GET as listTranscriptions } from "@/app/api/me/transcriptions/route";

vi.mock("@/lib/auth-server", () => ({
	getServerSession: vi.fn().mockResolvedValue(null),
}));

vi.mock("@/lib/trial-identity", () => ({
	resolveActorIdentity: vi.fn().mockResolvedValue({ actorId: "actor_1" }),
}));

vi.mock("@/services", () => ({
	actorsService: {
		ensureActor: vi.fn().mockResolvedValue(undefined),
		getOrCreateForUser: vi.fn(),
	},
	transcriptionsService: {
		findByUserId: vi.fn(),
		countByUserId: vi.fn(),
		findByActorId: vi.fn(),
		countByActorId: vi.fn(),
	},
	translationsService: {
		countByTranscriptionIds: vi.fn().mockResolvedValue(new Map()),
	},
}));

vi.mock("@/lib/logger", () => ({
	logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

describe("GET /api/me/transcriptions", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(resolveActorIdentity).mockResolvedValue({ actorId: "actor_1" });
		vi.mocked(actorsService.ensureActor).mockResolvedValue(undefined);
		vi.mocked(transcriptionsService.findByActorId).mockResolvedValue([]);
		vi.mocked(transcriptionsService.countByActorId).mockResolvedValue(0);
		vi.mocked(transcriptionsService.findByUserId).mockResolvedValue([]);
		vi.mocked(transcriptionsService.countByUserId).mockResolvedValue(0);
	});

	it("returns anonymous user's transcriptions when signed out", async () => {
		vi.mocked(getServerSession).mockResolvedValue(null);
		vi.mocked(transcriptionsService.findByActorId).mockResolvedValue([
			{
				id: "tr_1",
				filename: "anon-file.m4a",
				displayName: "Anonymous title",
				status: "completed",
				progress: 100,
				preview: "preview text",
				summaryStatus: null,
				summaryUpdatedAt: null,
				createdAt: "2026-02-18T00:00:00.000Z",
				completedAt: "2026-02-18T00:01:00.000Z",
				audioKey: "blob://a",
			},
		] as never);
		vi.mocked(transcriptionsService.countByActorId).mockResolvedValue(1);

		const response = await listTranscriptions(
			new Request("http://localhost:3000/api/me/transcriptions?limit=10"),
		);
		const body = await response.json();

		expect(response.status).toBe(200);
		expect(resolveActorIdentity).toHaveBeenCalledOnce();
		expect(actorsService.ensureActor).toHaveBeenCalledWith("actor_1");
		expect(transcriptionsService.findByActorId).toHaveBeenCalledWith(
			"actor_1",
			10,
		);
		expect(transcriptionsService.countByActorId).toHaveBeenCalledWith("actor_1");
		expect(body.total).toBe(1);
		expect(body.transcriptions).toHaveLength(1);
		expect(body.transcriptions[0].displayName).toBe("Anonymous title");
	});

	it("returns signed-in user's transcriptions when authenticated", async () => {
		vi.mocked(getServerSession).mockResolvedValue({
			user: { id: "user_1", email: "user@test.com", name: "User" },
			session: { id: "sess_1", userId: "user_1" },
		} as never);
		vi.mocked(transcriptionsService.findByUserId).mockResolvedValue([
			{
				id: "tr_1",
				filename: "user-file.m4a",
				displayName: "Signed-in title",
				status: "processing",
				progress: 40,
				preview: null,
				summaryStatus: null,
				summaryUpdatedAt: null,
				createdAt: "2026-02-18T00:00:00.000Z",
				completedAt: null,
				audioKey: "blob://a",
			},
		] as never);
		vi.mocked(transcriptionsService.countByUserId).mockResolvedValue(1);

		const response = await listTranscriptions(
			new Request("http://localhost:3000/api/me/transcriptions?limit=10"),
		);
		const body = await response.json();

		expect(response.status).toBe(200);
		expect(resolveActorIdentity).not.toHaveBeenCalled();
		expect(actorsService.ensureActor).not.toHaveBeenCalled();
		expect(transcriptionsService.findByUserId).toHaveBeenCalledWith(
			"user_1",
			10,
		);
		expect(transcriptionsService.countByUserId).toHaveBeenCalledWith("user_1");
		expect(body.total).toBe(1);
		expect(body.transcriptions).toHaveLength(1);
		expect(body.transcriptions[0].displayName).toBe("Signed-in title");
	});

	it("uses default limit when query parameter is invalid", async () => {
		vi.mocked(getServerSession).mockResolvedValue({
			user: { id: "user_1", email: "user@test.com", name: "User" },
			session: { id: "sess_1", userId: "user_1" },
		} as never);

		const response = await listTranscriptions(
			new Request("http://localhost:3000/api/me/transcriptions?limit=-10"),
		);

		expect(response.status).toBe(200);
		expect(transcriptionsService.findByUserId).toHaveBeenCalledWith(
			"user_1",
			50,
		);
	});
});
