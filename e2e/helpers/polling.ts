interface PollOptions {
	intervalMs?: number;
	timeoutMs?: number;
}

interface TranscriptionStatus {
	status: string;
	summaryStatus: string | null;
	preview: string | null;
	[key: string]: unknown;
}

export async function pollUntilComplete(
	apiGet: (path: string) => Promise<Response>,
	transcriptionId: string,
	options: PollOptions = {},
): Promise<TranscriptionStatus> {
	const { intervalMs = 3_000, timeoutMs = 150_000 } = options;
	const deadline = Date.now() + timeoutMs;

	while (Date.now() < deadline) {
		const res = await apiGet(`/api/transcriptions/${transcriptionId}`);
		if (!res.ok) {
			throw new Error(
				`Polling failed with status ${res.status}: ${await res.text()}`,
			);
		}

		const data: TranscriptionStatus = await res.json();

		if (data.status === "failed") {
			throw new Error(
				`Transcription failed: ${JSON.stringify(data)}`,
			);
		}

		if (
			data.status === "completed" &&
			(data.summaryStatus === "completed" || data.summaryStatus === null)
		) {
			return data;
		}

		await new Promise((r) => setTimeout(r, intervalMs));
	}

	throw new Error(
		`Timed out after ${timeoutMs}ms waiting for transcription ${transcriptionId}`,
	);
}
