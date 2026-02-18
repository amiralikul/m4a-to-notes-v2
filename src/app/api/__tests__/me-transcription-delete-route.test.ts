import { beforeEach, describe, expect, it, vi } from "vitest";
import { auth } from "@clerk/nextjs/server";
import { resolveActorIdentity } from "@/lib/trial-identity";
import { actorsService, storageService, transcriptionsService } from "@/services";
import { DELETE as deleteTranscription } from "../../api/me/transcriptions/[transcriptionId]/route";

vi.mock("@clerk/nextjs/server", () => ({
	auth: vi.fn().mockResolvedValue({ userId: null }),
	currentUser: vi.fn().mockResolvedValue(null),
}));

vi.mock("@/lib/trial-identity", () => ({
	resolveActorIdentity: vi.fn().mockResolvedValue({ actorId: "actor_1" }),
}));

vi.mock("@/services", () => ({
	actorsService: {
		ensureActor: vi.fn().mockResolvedValue(undefined),
	},
	storageService: {
		deleteObject: vi.fn().mockResolvedValue(undefined),
	},
	transcriptionsService: {
		findById: vi.fn(),
		delete: vi.fn().mockResolvedValue(undefined),
	},
}));

vi.mock("@/lib/logger", () => ({
	logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

describe("DELETE /api/me/transcriptions/[transcriptionId]", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(auth).mockResolvedValue({ userId: null } as never);
		vi.mocked(resolveActorIdentity).mockResolvedValue({ actorId: "actor_1" });
		vi.mocked(actorsService.ensureActor).mockResolvedValue(undefined);
		vi.mocked(storageService.deleteObject).mockResolvedValue(undefined);
		vi.mocked(transcriptionsService.delete).mockResolvedValue(undefined);
	});

	it("allows signed-in user to delete own transcription", async () => {
		vi.mocked(auth).mockResolvedValue({ userId: "user_1" } as never);
		vi.mocked(transcriptionsService.findById).mockResolvedValue({
			id: "tr_1",
			userId: "user_1",
			ownerId: "actor_1",
			audioKey: "blob://audio-1",
		} as never);

		const response = await deleteTranscription(new Request("http://x"), {
			params: Promise.resolve({ transcriptionId: "tr_1" }),
		});

		expect(response.status).toBe(204);
		expect(resolveActorIdentity).not.toHaveBeenCalled();
		expect(actorsService.ensureActor).not.toHaveBeenCalled();
		expect(storageService.deleteObject).toHaveBeenCalledWith("blob://audio-1");
		expect(transcriptionsService.delete).toHaveBeenCalledWith("tr_1");
	});

	it("allows anonymous user to delete own transcription", async () => {
		vi.mocked(auth).mockResolvedValue({ userId: null } as never);
		vi.mocked(resolveActorIdentity).mockResolvedValue({ actorId: "actor_1" });
		vi.mocked(transcriptionsService.findById).mockResolvedValue({
			id: "tr_1",
			userId: null,
			ownerId: "actor_1",
			audioKey: "blob://audio-1",
		} as never);

		const response = await deleteTranscription(new Request("http://x"), {
			params: Promise.resolve({ transcriptionId: "tr_1" }),
		});

		expect(response.status).toBe(204);
		expect(resolveActorIdentity).toHaveBeenCalledOnce();
		expect(actorsService.ensureActor).toHaveBeenCalledWith("actor_1");
		expect(storageService.deleteObject).toHaveBeenCalledWith("blob://audio-1");
		expect(transcriptionsService.delete).toHaveBeenCalledWith("tr_1");
	});

	it("returns 404 for anonymous non-owner", async () => {
		vi.mocked(auth).mockResolvedValue({ userId: null } as never);
		vi.mocked(resolveActorIdentity).mockResolvedValue({ actorId: "actor_1" });
		vi.mocked(transcriptionsService.findById).mockResolvedValue({
			id: "tr_2",
			userId: null,
			ownerId: "actor_2",
			audioKey: "blob://audio-2",
		} as never);

		const response = await deleteTranscription(new Request("http://x"), {
			params: Promise.resolve({ transcriptionId: "tr_2" }),
		});
		const body = await response.json();

		expect(response.status).toBe(404);
		expect(body.error).toBe("Transcription not found");
		expect(transcriptionsService.delete).not.toHaveBeenCalled();
	});
});
