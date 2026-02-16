import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/services", () => ({
	transcriptionsService: {
		findById: vi.fn(),
		markSummaryStarted: vi.fn(),
		markSummaryCompleted: vi.fn(),
		markSummaryFailed: vi.fn(),
	},
	aiService: {
		summaryProvider: "openai",
		summaryModel: "gpt-5-mini",
		generateSummary: vi.fn(),
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

import { aiService, transcriptionsService } from "@/services";

async function runProcessSummary(transcriptionId: string) {
	const { processSummary } = await import("../process-summary");

	const fn = processSummary as unknown as {
		fn: (args: {
			event: { data: { transcriptionId: string } };
			step: {
				run: <T>(name: string, fn: () => Promise<T>) => Promise<T>;
			};
		}) => Promise<unknown>;
	};

	const step = {
		run: async <T>(_name: string, handler: () => Promise<T>): Promise<T> => {
			return handler();
		},
	};

	return fn.fn({
		event: { data: { transcriptionId } },
		step,
	});
}

describe("process-summary Inngest function", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("generates and saves summary for a completed transcription", async () => {
		vi.mocked(transcriptionsService.findById).mockResolvedValue({
			id: "tx-1",
			status: "completed",
			transcriptText: "Meeting transcript text",
			summaryStatus: "pending",
		} as never);
		vi.mocked(transcriptionsService.markSummaryStarted).mockResolvedValue(
			{} as never,
		);
		vi.mocked(aiService.generateSummary).mockResolvedValue({
			summary: "Discussed release readiness.",
			keyPoints: ["QA complete", "Deploy Friday"],
			actionItems: [{ task: "Prepare release notes", owner: "Alex" }],
			keyTakeaways: ["Release is on track"],
		});
		vi.mocked(transcriptionsService.markSummaryCompleted).mockResolvedValue(
			{} as never,
		);

		const result = await runProcessSummary("tx-1");

		expect(result).toEqual({
			status: "completed",
			transcriptionId: "tx-1",
			keyPoints: 2,
			actionItems: 1,
		});
		expect(transcriptionsService.markSummaryStarted).toHaveBeenCalledWith(
			"tx-1",
			"openai",
			"gpt-5-mini",
		);
		expect(aiService.generateSummary).toHaveBeenCalledWith(
			"Meeting transcript text",
		);
		expect(transcriptionsService.markSummaryCompleted).toHaveBeenCalled();
	});

	it("skips when summary is already completed", async () => {
		vi.mocked(transcriptionsService.findById).mockResolvedValue({
			id: "tx-2",
			status: "completed",
			transcriptText: "Transcript",
			summaryStatus: "completed",
			summaryData: {
				summary: "Done",
				keyPoints: ["A"],
				actionItems: [],
				keyTakeaways: ["B"],
			},
		} as never);

		const result = await runProcessSummary("tx-2");

		expect(result).toEqual({
			status: "skipped",
			transcriptionId: "tx-2",
		});
		expect(transcriptionsService.markSummaryStarted).not.toHaveBeenCalled();
		expect(aiService.generateSummary).not.toHaveBeenCalled();
	});

	it("throws when transcription is not ready for summary", async () => {
		vi.mocked(transcriptionsService.findById).mockResolvedValue({
			id: "tx-3",
			status: "processing",
			transcriptText: null,
			summaryStatus: null,
		} as never);

		await expect(runProcessSummary("tx-3")).rejects.toThrow(
			"Transcript not available for summary",
		);
	});
});
