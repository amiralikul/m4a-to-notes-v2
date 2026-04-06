import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/services", () => ({
	transcriptionsService: {
		findById: vi.fn(),
		markSummaryStarted: vi.fn(),
		markSummaryCompleted: vi.fn(),
		markSummaryFailed: vi.fn(),
		update: vi.fn(),
	},
	textAiService: {
		provider: "openai",
		model: "gpt-5-mini",
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

import { textAiService, transcriptionsService } from "@/services";

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

const mockFlexibleSummary = {
	contentType: "meeting",
	summary: "Discussed release readiness.",
	sections: [
		{ key: "keyPoints", label: "Key Points", items: ["QA complete", "Deploy Friday"] },
		{ key: "actionItems", label: "Action Items", items: [{ text: "Prepare release notes", owner: "Alex" }] },
		{ key: "keyTakeaways", label: "Key Takeaways", items: ["Release is on track"] },
	],
};

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
			contentType: null,
		} as never);
		vi.mocked(transcriptionsService.markSummaryStarted).mockResolvedValue(
			{} as never,
		);
		vi.mocked(textAiService.generateSummary).mockResolvedValue(mockFlexibleSummary);
		vi.mocked(transcriptionsService.markSummaryCompleted).mockResolvedValue(
			{} as never,
		);
		vi.mocked(transcriptionsService.update).mockResolvedValue({} as never);

		const result = await runProcessSummary("tx-1");

		expect(result).toEqual({
			status: "completed",
			transcriptionId: "tx-1",
			contentType: "meeting",
			sections: 3,
		});
		expect(transcriptionsService.markSummaryStarted).toHaveBeenCalledWith(
			"tx-1",
			"openai",
			"gpt-5-mini",
		);
		expect(textAiService.generateSummary).toHaveBeenCalledWith(
			"Meeting transcript text",
			null,
		);
		expect(transcriptionsService.markSummaryCompleted).toHaveBeenCalled();
		expect(transcriptionsService.update).toHaveBeenCalledWith("tx-1", {
			contentType: "meeting",
		});
	});

	it("preserves user-selected content type and does not overwrite", async () => {
		vi.mocked(transcriptionsService.findById).mockResolvedValue({
			id: "tx-4",
			status: "completed",
			transcriptText: "Lecture transcript text",
			summaryStatus: "pending",
			contentType: "lecture",
		} as never);
		vi.mocked(transcriptionsService.markSummaryStarted).mockResolvedValue(
			{} as never,
		);
		vi.mocked(textAiService.generateSummary).mockResolvedValue({
			...mockFlexibleSummary,
			contentType: "lecture",
		});
		vi.mocked(transcriptionsService.markSummaryCompleted).mockResolvedValue(
			{} as never,
		);

		await runProcessSummary("tx-4");

		expect(textAiService.generateSummary).toHaveBeenCalledWith(
			"Lecture transcript text",
			"lecture",
		);
		expect(transcriptionsService.update).not.toHaveBeenCalled();
	});

	it("skips when summary is already completed", async () => {
		vi.mocked(transcriptionsService.findById).mockResolvedValue({
			id: "tx-2",
			status: "completed",
			transcriptText: "Transcript",
			summaryStatus: "completed",
			summaryData: mockFlexibleSummary,
		} as never);

		const result = await runProcessSummary("tx-2");

		expect(result).toEqual({
			status: "skipped",
			transcriptionId: "tx-2",
		});
		expect(transcriptionsService.markSummaryStarted).not.toHaveBeenCalled();
		expect(textAiService.generateSummary).not.toHaveBeenCalled();
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
