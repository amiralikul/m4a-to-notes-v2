import type {
	DashboardSummaryPayload,
	DashboardTranscriptionDetail,
} from "@/components/dashboard/types";

const DETAIL_POLL_INTERVAL_MS = 3_000;
const SUMMARY_RETRY_MAX_DELAY_MS = 30_000;

export class SummaryNotReadyError extends Error {
	constructor() {
		super("Summary is not available yet.");
		this.name = "SummaryNotReadyError";
	}
}

export async function fetchSummary(
	id: string,
): Promise<DashboardSummaryPayload> {
	const res = await fetch(`/api/transcriptions/${id}/summary`, {
		cache: "no-store",
	});

	if (!res.ok) {
		if (res.status === 404) {
			throw new SummaryNotReadyError();
		}

		throw new Error(`Failed to fetch summary (${res.status})`);
	}

	return res.json();
}

export function getDetailRefetchInterval(
	detail: Pick<DashboardTranscriptionDetail, "status" | "summaryStatus"> | null | undefined,
): number | false {
	if (!detail) {
		return false;
	}

	const transcriptionInFlight =
		detail.status === "pending" || detail.status === "processing";
	const summaryInFlight =
		detail.summaryStatus === "pending" || detail.summaryStatus === "processing";

	return transcriptionInFlight || summaryInFlight
		? DETAIL_POLL_INTERVAL_MS
		: false;
}

export function getTimedPollingInterval({
	hasInProgress,
	startedAt,
	now,
	maxPollingMs,
	shortIntervalMs,
	longIntervalMs,
	shortWindowMs = 60_000,
}: {
	hasInProgress: boolean;
	startedAt: number | null;
	now: number;
	maxPollingMs: number;
	shortIntervalMs: number;
	longIntervalMs: number;
	shortWindowMs?: number;
}): { interval: number | false; startedAt: number | null } {
	if (!hasInProgress) {
		return {
			interval: false,
			startedAt: null,
		};
	}

	const nextStartedAt = startedAt ?? now;
	const elapsed = now - nextStartedAt;

	if (elapsed > maxPollingMs) {
		return {
			interval: false,
			startedAt: nextStartedAt,
		};
	}

	return {
		interval: elapsed < shortWindowMs ? shortIntervalMs : longIntervalMs,
		startedAt: nextStartedAt,
	};
}

export function getSummaryRetryDelay(failureCount: number): number {
	return Math.min(
		1000 * 2 ** Math.max(0, failureCount - 1),
		SUMMARY_RETRY_MAX_DELAY_MS,
	);
}

export function shouldRetrySummary({
	error,
	startedAt,
	now,
	maxPollingMs,
}: {
	error: unknown;
	startedAt: number | null;
	now: number;
	maxPollingMs: number;
}): { retry: boolean; startedAt: number | null } {
	if (!(error instanceof SummaryNotReadyError)) {
		return {
			retry: false,
			startedAt: null,
		};
	}

	const nextStartedAt = startedAt ?? now;

	return {
		retry: now - nextStartedAt <= maxPollingMs,
		startedAt: nextStartedAt,
	};
}

export function isTranslationQueryReady({
	isLoaded,
	isSignedIn,
	selectedId,
	detail,
}: {
	isLoaded: boolean;
	isSignedIn: boolean;
	selectedId: string | null;
	detail: Pick<DashboardTranscriptionDetail, "status" | "summaryStatus"> | null;
}): boolean {
	return Boolean(
		isLoaded &&
			isSignedIn &&
			selectedId &&
			detail?.status === "completed" &&
			detail.summaryStatus === "completed",
	);
}
