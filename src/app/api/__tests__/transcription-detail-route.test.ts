import { beforeEach, describe, expect, it, vi } from "vitest";
import { getServerSession } from "@/lib/auth-server";
import { resolveActorIdentity } from "@/lib/trial-identity";
import { actorsService, transcriptionsService } from "@/services";
import { GET as getTranscriptionDetail } from "@/app/api/transcriptions/[transcriptionId]/detail/route";

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
		getDetailForOwner: vi.fn(),
	},
}));

vi.mock("@/lib/logger", () => ({
	logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

describe("GET /api/transcriptions/[transcriptionId]/detail", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(getServerSession).mockResolvedValue(null);
		vi.mocked(resolveActorIdentity).mockResolvedValue({ actorId: "actor_1" });
		vi.mocked(actorsService.ensureActor).mockResolvedValue(undefined);
	});

	it("returns displayName in the detail payload", async () => {
		vi.mocked(transcriptionsService.getDetailForOwner).mockResolvedValue({
			transcriptionId: "tr_1",
			filename: "meeting.m4a",
			displayName: "Team Sync",
			status: "completed",
			progress: 100,
			createdAt: "2026-03-20T00:00:00.000Z",
			completedAt: "2026-03-20T00:05:00.000Z",
			preview: "hello",
			enableDiarization: false,
			diarizationData: null,
			transcriptText: "hello",
			summaryStatus: null,
			summaryUpdatedAt: null,
		} as never);

		const response = await getTranscriptionDetail(new Request("http://x"), {
			params: Promise.resolve({ transcriptionId: "tr_1" }),
		});
		const body = await response.json();

		expect(response.status).toBe(200);
		expect(body.displayName).toBe("Team Sync");
		expect(body.filename).toBe("meeting.m4a");
	});
});
