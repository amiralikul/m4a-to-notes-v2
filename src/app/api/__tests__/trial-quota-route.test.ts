import { beforeEach, describe, expect, it, vi } from "vitest";
import { auth } from "@clerk/nextjs/server";
import { TRIAL_ERROR_CODES } from "@/lib/trial-errors";
import { getUtcDayKey, resolveActorIdentity } from "@/lib/trial-identity";
import { actorsService, trialUsageService } from "@/services";
import { GET as getTrialQuota } from "../../api/trial/quota/route";

vi.mock("@clerk/nextjs/server", () => ({
	auth: vi.fn().mockResolvedValue({ userId: null }),
	currentUser: vi.fn().mockResolvedValue(null),
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
	trialUsageService: {
		getRemaining: vi.fn().mockResolvedValue(3),
	},
}));

describe("Trial quota route", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(auth).mockResolvedValue({ userId: null } as never);
		vi.mocked(resolveActorIdentity).mockResolvedValue({ actorId: "actor-1" });
		vi.mocked(actorsService.ensureActor).mockResolvedValue(undefined);
		vi.mocked(getUtcDayKey).mockReturnValue("2026-02-16");
		vi.mocked(trialUsageService.getRemaining).mockResolvedValue(2);
	});

	it("returns remaining quota for anonymous user", async () => {
		const response = await getTrialQuota();
		const body = await response.json();

		expect(response.status).toBe(200);
		expect(body).toMatchObject({
			limited: true,
			remaining: 2,
			limit: 3,
		});
		expect(actorsService.ensureActor).toHaveBeenCalledWith("actor-1");
	});

	it("returns coded 429 when anonymous quota is exhausted", async () => {
		vi.mocked(trialUsageService.getRemaining).mockResolvedValue(0);

		const response = await getTrialQuota();
		const body = await response.json();

		expect(response.status).toBe(429);
		expect(body.code).toBe(TRIAL_ERROR_CODES.DAILY_LIMIT_REACHED);
		expect(body.remaining).toBe(0);
	});

	it("returns unlimited response for signed-in user", async () => {
		vi.mocked(auth).mockResolvedValue({ userId: "user_123" } as never);

		const response = await getTrialQuota();
		const body = await response.json();

		expect(response.status).toBe(200);
		expect(body).toMatchObject({
			limited: false,
			remaining: null,
			limit: null,
		});
		expect(trialUsageService.getRemaining).not.toHaveBeenCalled();
		expect(actorsService.ensureActor).not.toHaveBeenCalled();
	});
});
