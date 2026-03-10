import { beforeEach, describe, expect, it, vi } from "vitest";
import { getServerSession } from "@/lib/auth-server";
import { TRIAL_ERROR_CODES } from "@/lib/trial-errors";
import { getUtcDayKey, resolveActorIdentity } from "@/lib/trial-identity";
import { actorsService, trialUsageService } from "@/services";
import { GET as getTrialQuota } from "@/app/api/trial/quota/route";

vi.mock("@/lib/auth-server", () => ({
	getServerSession: vi.fn().mockResolvedValue(null),
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

vi.mock("@/lib/logger", () => ({
	logger: {
		info: vi.fn(),
		warn: vi.fn(),
		error: vi.fn(),
		debug: vi.fn(),
	},
}));

function makeRequest() {
	return new Request("http://localhost/api/trial/quota");
}

describe("Trial quota route", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(getServerSession).mockResolvedValue(null);
		vi.mocked(resolveActorIdentity).mockResolvedValue({ actorId: "actor-1" });
		vi.mocked(actorsService.ensureActor).mockResolvedValue(undefined);
		vi.mocked(getUtcDayKey).mockReturnValue("2026-02-16");
		vi.mocked(trialUsageService.getRemaining).mockResolvedValue(2);
	});

	it("returns remaining quota for anonymous user", async () => {
		const response = await getTrialQuota(makeRequest());
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

		const response = await getTrialQuota(makeRequest());
		const body = await response.json();

		expect(response.status).toBe(429);
		expect(body.code).toBe(TRIAL_ERROR_CODES.DAILY_LIMIT_REACHED);
		expect(body.remaining).toBe(0);
	});

	it("returns unlimited response for signed-in user", async () => {
		vi.mocked(getServerSession).mockResolvedValue({
			user: { id: "user_123", email: "user@test.com", name: "User" },
			session: { id: "sess_1", userId: "user_123" },
		} as never);

		const response = await getTrialQuota(makeRequest());
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
