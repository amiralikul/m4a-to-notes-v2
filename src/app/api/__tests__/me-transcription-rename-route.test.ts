import { beforeEach, describe, expect, it, vi } from "vitest";
import { getServerSession } from "@/lib/auth-server";
import { resolveActorIdentity } from "@/lib/trial-identity";
import { actorsService, transcriptionsService } from "@/services";
import { PATCH as renameTranscription } from "@/app/api/me/transcriptions/[transcriptionId]/route";

vi.mock("@/lib/auth-server", () => ({
	getServerSession: vi.fn().mockResolvedValue(null),
}));

vi.mock("@/lib/trial-identity", () => ({
	resolveActorIdentity: vi.fn().mockResolvedValue({ actorId: "actor_1" }),
}));

vi.mock("@/services", () => ({
	actorsService: {
		ensureActor: vi.fn().mockResolvedValue(undefined),
	},
	transcriptionsService: {
		findByIdForOwner: vi.fn(),
		updateDisplayName: vi.fn(),
	},
}));

vi.mock("@/lib/logger", () => ({
	logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

describe("PATCH /api/me/transcriptions/[transcriptionId]", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(getServerSession).mockResolvedValue(null);
		vi.mocked(resolveActorIdentity).mockResolvedValue({ actorId: "actor_1" });
		vi.mocked(actorsService.ensureActor).mockResolvedValue(undefined);
	});

	it("allows signed-out owner to rename their transcription", async () => {
		vi.mocked(transcriptionsService.findByIdForOwner).mockResolvedValue({
			id: "tr_1",
			filename: "meeting.m4a",
			displayName: null,
			userId: null,
			ownerId: "actor_1",
		} as never);
		vi.mocked(transcriptionsService.updateDisplayName).mockResolvedValue({
			id: "tr_1",
			filename: "meeting.m4a",
			displayName: "Team Sync",
		} as never);

		const response = await renameTranscription(
			new Request("http://x", {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ displayName: " Team Sync " }),
			}),
			{ params: Promise.resolve({ transcriptionId: "tr_1" }) },
		);
		const body = await response.json();

		expect(response.status).toBe(200);
		expect(resolveActorIdentity).toHaveBeenCalledOnce();
		expect(actorsService.ensureActor).toHaveBeenCalledWith("actor_1");
		expect(transcriptionsService.findByIdForOwner).toHaveBeenCalledWith(
			"tr_1",
			{ userId: null, actorId: "actor_1" },
		);
		expect(transcriptionsService.updateDisplayName).toHaveBeenCalledWith(
			"tr_1",
			"Team Sync",
		);
		expect(body.id).toBe("tr_1");
		expect(body.filename).toBe("meeting.m4a");
		expect(body.displayName).toBe("Team Sync");
		expect(body.userId).toBeUndefined();
		expect(body.ownerId).toBeUndefined();
		expect(body.source).toBeUndefined();
	});

	it("allows signed-in owner to rename their transcription", async () => {
		vi.mocked(getServerSession).mockResolvedValue({
			user: { id: "user_1", email: "user@test.com", name: "User" },
			session: { id: "sess_1", userId: "user_1" },
		} as never);
		vi.mocked(transcriptionsService.findByIdForOwner).mockResolvedValue({
			id: "tr_1",
			filename: "meeting.m4a",
			displayName: null,
			userId: "user_1",
			ownerId: "actor_1",
		} as never);
		vi.mocked(transcriptionsService.updateDisplayName).mockResolvedValue({
			id: "tr_1",
			filename: "meeting.m4a",
			displayName: "Q1 Review",
		} as never);

		const response = await renameTranscription(
			new Request("http://x", {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ displayName: "Q1 Review" }),
			}),
			{ params: Promise.resolve({ transcriptionId: "tr_1" }) },
		);

		expect(response.status).toBe(200);
		expect(resolveActorIdentity).not.toHaveBeenCalled();
		expect(actorsService.ensureActor).not.toHaveBeenCalled();
		expect(transcriptionsService.findByIdForOwner).toHaveBeenCalledWith(
			"tr_1",
			{ userId: "user_1", actorId: null },
		);
		expect(transcriptionsService.updateDisplayName).toHaveBeenCalledWith(
			"tr_1",
			"Q1 Review",
		);
	});

	it("returns 400 for whitespace-only names", async () => {
		const response = await renameTranscription(
			new Request("http://x", {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ displayName: "   " }),
			}),
			{ params: Promise.resolve({ transcriptionId: "tr_1" }) },
		);
		const body = await response.json();

		expect(response.status).toBe(400);
		expect(body.error).toBe("Display name cannot be empty");
		expect(transcriptionsService.findByIdForOwner).not.toHaveBeenCalled();
		expect(transcriptionsService.updateDisplayName).not.toHaveBeenCalled();
	});

	it("returns 404 when transcription is not owned by the requester", async () => {
		vi.mocked(transcriptionsService.findByIdForOwner).mockResolvedValue(null);

		const response = await renameTranscription(
			new Request("http://x", {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ displayName: "Team Sync" }),
			}),
			{ params: Promise.resolve({ transcriptionId: "tr_404" }) },
		);
		const body = await response.json();

		expect(response.status).toBe(404);
		expect(body.error).toBe("Transcription not found");
		expect(transcriptionsService.updateDisplayName).not.toHaveBeenCalled();
	});
});
