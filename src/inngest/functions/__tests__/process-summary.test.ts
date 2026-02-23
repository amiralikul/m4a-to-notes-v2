import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("ai", () => ({
	generateText: vi.fn(),
	Output: {
		object: ({ schema }: { schema: unknown }) => ({ type: "object", schema }),
	},
}));

vi.mock("@/services", () => ({
	transcriptionsService: {
		findById: vi.fn(),
		markSummaryStarted: vi.fn(),
		markSummaryCompleted: vi.fn(),
		markSummaryFailed: vi.fn(),
	},
	textAiService: {
		provider: "openai",
		model: "gpt-5-mini",
		buildSummaryRequest: vi.fn().mockReturnValue({
			model: { modelId: "gpt-5-mini" },
			system: "system prompt",
			prompt: "summarize",
			output: { type: "object" },
		}),
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

import { generateText } from "ai";
import { textAiService, transcriptionsService } from "@/services";

async function runProcessSummary(transcriptionId: string) {
	const { processSummary } = await import("../process-summary");

	const fn = processSummary as unknown as {
		fn: (args: {
			event: { data: { transcriptionId: string } };
			step: {
				run: <T>(name: string, fn: () => Promise<T>) => Promise<T>;
				ai: {
					wrap: <T>(
						name: string,
						fn: (...args: unknown[]) => Promise<T>,
						params: unknown,
					) => Promise<T>;
				};
			};
			logger: Record<string, unknown>;
		}) => Promise<unknown>;
	};

	const step = {
		run: async <T>(_name: string, handler: () => Promise<T>): Promise<T> => {
			return handler();
		},
		ai: {
			wrap: async <T>(
				_name: string,
				wrappedFn: (...args: unknown[]) => Promise<T>,
				params: unknown,
			): Promise<T> => {
				return wrappedFn(params);
			},
		},
	};

	const logger = {
		info: vi.fn(),
		warn: vi.fn(),
		error: vi.fn(),
		debug: vi.fn(),
	};

	return fn.fn({
		event: { data: { transcriptionId } },
		step,
		logger,
	});
}

describe("process-summary Inngest function", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("generates and saves summary for a completed transcription", async () => {
		const summaryData = {
			summary: "Discussed release readiness.",
			keyPoints: ["QA complete", "Deploy Friday"],
			actionItems: [{ task: "Prepare release notes", owner: "Alex", dueDate: null }],
			keyTakeaways: ["Release is on track"],
		};

		vi.mocked(transcriptionsService.findById).mockResolvedValue({
			id: "tx-1",
			status: "completed",
			transcriptText: "Meeting transcript text",
			summaryStatus: "pending",
		} as never);
		vi.mocked(transcriptionsService.markSummaryStarted).mockResolvedValue(
			{} as never,
		);
		vi.mocked(generateText).mockResolvedValue({
			output: summaryData,
		} as never);
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
		expect(textAiService.buildSummaryRequest).toHaveBeenCalledWith(
			"Meeting transcript text",
		);
		expect(generateText).toHaveBeenCalled();
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
		expect(generateText).not.toHaveBeenCalled();
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
