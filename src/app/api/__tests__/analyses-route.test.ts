import { beforeEach, describe, expect, it, vi } from "vitest";
import { auth } from "@clerk/nextjs/server";
import { POST as createAnalysis } from "@/app/api/analyses/route";
import { GET as getAnalysis } from "@/app/api/analyses/[analysisId]/route";
import { JobSourceType } from "@/services/job-analyses";
import {
	brightDataService,
	jobAnalysesService,
	workflowService,
} from "@/services";

vi.mock("@clerk/nextjs/server", () => ({
	auth: vi.fn(),
}));

vi.mock("@/services", () => ({
	brightDataService: {
		isSupportedLinkedinJobUrl: vi.fn(),
	},
	jobAnalysesService: {
		create: vi.fn(),
		findByIdForUser: vi.fn(),
		markFailed: vi.fn(),
	},
	workflowService: {
		requestJobAnalysis: vi.fn(),
	},
}));

vi.mock("@/lib/logger", () => ({
	logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

describe("Job analyses API", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(auth).mockResolvedValue({ userId: "user_1" } as never);
		vi.mocked(brightDataService.isSupportedLinkedinJobUrl).mockReturnValue(true);
		vi.mocked(jobAnalysesService.create).mockResolvedValue("analysis-1");
		vi.mocked(jobAnalysesService.markFailed).mockResolvedValue({} as never);
		vi.mocked(workflowService.requestJobAnalysis).mockResolvedValue(undefined);
	});

	it("queues analysis for pasted job description", async () => {
		const response = await createAnalysis(
			new Request("http://localhost:3000/api/analyses", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					resumeText: "A".repeat(120),
					jobDescription: "B".repeat(120),
				}),
			}),
		);

		expect(response.status).toBe(202);
		expect(jobAnalysesService.create).toHaveBeenCalledWith(
			expect.objectContaining({
				userId: "user_1",
				jobSourceType: JobSourceType.TEXT,
			}),
		);
		expect(workflowService.requestJobAnalysis).toHaveBeenCalledWith("analysis-1");
	});

	it("returns 401 when unauthenticated", async () => {
		vi.mocked(auth).mockResolvedValue({ userId: null } as never);

		const response = await createAnalysis(
			new Request("http://localhost:3000/api/analyses", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					resumeText: "A".repeat(120),
					jobDescription: "B".repeat(120),
				}),
			}),
		);

		expect(response.status).toBe(401);
		expect(jobAnalysesService.create).not.toHaveBeenCalled();
	});

	it("marks analysis failed when workflow trigger fails", async () => {
		vi.mocked(workflowService.requestJobAnalysis).mockRejectedValue(
			new Error("trigger failed"),
		);

		const response = await createAnalysis(
			new Request("http://localhost:3000/api/analyses", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					resumeText: "A".repeat(120),
					jobDescription: "B".repeat(120),
				}),
			}),
		);

		expect(response.status).toBe(500);
		expect(jobAnalysesService.markFailed).toHaveBeenCalledWith(
			"analysis-1",
			"WORKFLOW_TRIGGER_FAILED",
			"trigger failed",
		);
	});

	it("rejects non-LinkedIn job URLs", async () => {
		vi.mocked(brightDataService.isSupportedLinkedinJobUrl).mockReturnValue(false);

		const response = await createAnalysis(
			new Request("http://localhost:3000/api/analyses", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					resumeText: "A".repeat(120),
					jobUrl: "https://example.com/jobs/123",
				}),
			}),
		);

		expect(response.status).toBe(400);
		expect(jobAnalysesService.create).not.toHaveBeenCalled();
	});

	it("returns analysis payload by id", async () => {
		vi.mocked(jobAnalysesService.findByIdForUser).mockResolvedValue({
			id: "analysis-1",
			status: "completed",
			jobSourceType: "text",
			jobUrl: null,
			compatibilityScore: 84,
			resultData: {
				compatibilityScore: 84,
				compatibilitySummary: "Strong fit",
				strengths: ["x"],
				gaps: ["y"],
				interviewQuestions: ["q1", "q2", "q3"],
				interviewPreparation: ["p1"],
				oneWeekPlan: [
					{ day: 1, title: "Day 1", tasks: ["t1"] },
					{ day: 2, title: "Day 2", tasks: ["t2"] },
					{ day: 3, title: "Day 3", tasks: ["t3"] },
					{ day: 4, title: "Day 4", tasks: ["t4"] },
					{ day: 5, title: "Day 5", tasks: ["t5"] },
					{ day: 6, title: "Day 6", tasks: ["t6"] },
					{ day: 7, title: "Day 7", tasks: ["t7"] },
				],
			},
			errorCode: null,
			errorMessage: null,
			createdAt: "2026-02-20T00:00:00.000Z",
			startedAt: "2026-02-20T00:00:01.000Z",
			completedAt: "2026-02-20T00:00:20.000Z",
			updatedAt: "2026-02-20T00:00:20.000Z",
		} as never);

		const response = await getAnalysis(new Request("http://localhost:3000"), {
			params: Promise.resolve({ analysisId: "analysis-1" }),
		});
		const body = await response.json();

		expect(response.status).toBe(200);
		expect(body.analysisId).toBe("analysis-1");
		expect(body.status).toBe("completed");
		expect(body.compatibilityScore).toBe(84);
	});

	it("returns 404 for missing user-scoped analysis", async () => {
		vi.mocked(jobAnalysesService.findByIdForUser).mockResolvedValue(null);

		const response = await getAnalysis(new Request("http://localhost:3000"), {
			params: Promise.resolve({ analysisId: "missing-analysis" }),
		});

		expect(response.status).toBe(404);
	});
});
