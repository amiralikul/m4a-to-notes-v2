import { afterEach, describe, expect, it, vi } from "vitest";
import {
	fetchSummary,
	getDetailRefetchInterval,
	getSummaryRetryDelay,
	getTimedPollingInterval,
	isTranslationQueryReady,
	shouldRetrySummary,
	SummaryNotReadyError,
} from "@/components/dashboard/dashboard-workspace-queries";

afterEach(() => {
	vi.unstubAllGlobals();
});

describe("fetchSummary", () => {
	it("throws a transient error when the summary endpoint returns 404", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue({
				ok: false,
				status: 404,
			}),
		);

		await expect(fetchSummary("tr_123")).rejects.toBeInstanceOf(
			SummaryNotReadyError,
		);
	});

	it("throws a terminal error for non-404 failures", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue({
				ok: false,
				status: 500,
			}),
		);

		await expect(fetchSummary("tr_123")).rejects.toThrow(
			"Failed to fetch summary (500)",
		);
	});
});

describe("getDetailRefetchInterval", () => {
	it("polls while the transcription itself is still in flight", () => {
		expect(
			getDetailRefetchInterval({
				status: "processing",
				summaryStatus: "pending",
			}),
		).toBe(3_000);
	});

	it("polls while the summary is still in flight after transcription completion", () => {
		expect(
			getDetailRefetchInterval({
				status: "completed",
				summaryStatus: "processing",
			}),
		).toBe(3_000);
	});

	it("stops polling when both transcription and summary are terminal", () => {
		expect(
			getDetailRefetchInterval({
				status: "completed",
				summaryStatus: "completed",
			}),
		).toBe(false);
	});
});

describe("getTimedPollingInterval", () => {
	it("starts polling when in-flight items appear", () => {
		expect(
			getTimedPollingInterval({
				hasInProgress: true,
				startedAt: null,
				now: 1_000,
				maxPollingMs: 10_000,
				shortIntervalMs: 3_000,
				longIntervalMs: 10_000,
			}),
		).toEqual({
			interval: 3_000,
			startedAt: 1_000,
		});
	});

	it("resets the timer when nothing is in progress", () => {
		expect(
			getTimedPollingInterval({
				hasInProgress: false,
				startedAt: 1_000,
				now: 2_000,
				maxPollingMs: 10_000,
				shortIntervalMs: 3_000,
				longIntervalMs: 10_000,
			}),
		).toEqual({
			interval: false,
			startedAt: null,
		});
	});
});

describe("shouldRetrySummary", () => {
	it("keeps retrying transient summary misses within the polling window", () => {
		expect(
			shouldRetrySummary({
				error: new SummaryNotReadyError(),
				startedAt: null,
				now: 5_000,
				maxPollingMs: 10_000,
			}),
		).toEqual({
			retry: true,
			startedAt: 5_000,
		});
	});

	it("stops retrying transient summary misses after the polling window elapses", () => {
		expect(
			shouldRetrySummary({
				error: new SummaryNotReadyError(),
				startedAt: 1_000,
				now: 12_000,
				maxPollingMs: 10_000,
			}),
		).toEqual({
			retry: false,
			startedAt: 1_000,
		});
	});

	it("does not retry terminal summary errors", () => {
		expect(
			shouldRetrySummary({
				error: new Error("boom"),
				startedAt: 1_000,
				now: 2_000,
				maxPollingMs: 10_000,
			}),
		).toEqual({
			retry: false,
			startedAt: null,
		});
	});
});

describe("getSummaryRetryDelay", () => {
	it("uses exponential backoff with a cap", () => {
		expect(getSummaryRetryDelay(1)).toBe(1_000);
		expect(getSummaryRetryDelay(2)).toBe(2_000);
		expect(getSummaryRetryDelay(6)).toBe(30_000);
	});
});

describe("isTranslationQueryReady", () => {
	it("only enables translations once the detail and summary are both completed", () => {
		expect(
			isTranslationQueryReady({
				isLoaded: true,
				isSignedIn: true,
				selectedId: "tr_123",
				detail: {
					status: "completed",
					summaryStatus: "completed",
				},
			}),
		).toBe(true);

		expect(
			isTranslationQueryReady({
				isLoaded: true,
				isSignedIn: true,
				selectedId: "tr_123",
				detail: {
					status: "completed",
					summaryStatus: "processing",
				},
			}),
		).toBe(false);
	});
});
