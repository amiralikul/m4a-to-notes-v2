import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Clerk auth
vi.mock("@clerk/nextjs/server", () => ({
	auth: vi.fn().mockResolvedValue({ userId: null }),
	currentUser: vi.fn().mockResolvedValue(null),
}));

// Mock services to prevent real DB connections
vi.mock("@/services", () => ({
	transcriptionsService: {
		getStatus: vi.fn(),
		findById: vi.fn(),
		markSummaryPending: vi.fn(),
	},
	usersService: { getWithDefaults: vi.fn() },
	workflowService: {
		startTranscription: vi.fn(),
		regenerateSummary: vi.fn(),
	},
}));

vi.mock("@/lib/logger", () => ({
	logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

vi.mock("@/db", () => ({
	db: {},
}));

const protectedRoutes = [
	{
		method: "POST",
		path: "/api/transcriptions/test-id/summary/regenerate",
		module: () =>
			import(
				"../../api/transcriptions/[transcriptionId]/summary/regenerate/route"
			),
	},
	{
		method: "GET",
		path: "/api/me/entitlements",
		module: () => import("../../api/me/entitlements/route"),
	},
	{
		method: "POST",
		path: "/api/validate-purchase",
		module: () => import("../../api/validate-purchase/route"),
	},
	{
		method: "POST",
		path: "/api/lemonsqueezy/portal",
		module: () => import("../../api/lemonsqueezy/portal/route"),
	},
	{
		method: "POST",
		path: "/api/lemonsqueezy/cancel",
		module: () => import("../../api/lemonsqueezy/cancel/route"),
	},
	{
		method: "POST",
		path: "/api/lemonsqueezy/checkout",
		module: () => import("../../api/lemonsqueezy/checkout/route"),
	},
];

describe("Auth guard tests (#12)", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it.each(protectedRoutes)(
		"$method $path returns 401 without auth",
		async ({ method, module }) => {
			const mod = await module() as Record<string, (...args: unknown[]) => Promise<Response>>;
			const handler = mod[method];

			const request = new Request("http://localhost:3000/test", {
				method,
				...(method === "POST"
					? {
							body: JSON.stringify({}),
							headers: { "Content-Type": "application/json" },
						}
					: {}),
			});

			const response =
				handler.length > 1
					? await handler(request, {
							params: Promise.resolve({ transcriptionId: "test-id" }),
						})
					: await handler(request);

			expect(response.status).toBe(401);
			const body = await response.json();
			expect(body.error).toBe("Unauthorized");
		},
	);
});
