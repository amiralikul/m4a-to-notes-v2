import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { TranscriptionSidebar } from "../transcription-sidebar";

const sampleListItem = {
	id: "tr_1",
	filename: "Meeting.m4a",
	createdAt: "2026-03-31T10:00:00.000Z",
	status: "completed" as const,
	progress: 100,
	preview: "Kickoff notes and next steps.",
	summaryStatus: "completed" as const,
	summaryUpdatedAt: "2026-03-31T10:05:00.000Z",
	audioKey: "https://example.com/meeting.m4a",
	enableDiarization: true,
	translationCount: 2,
};

describe("TranscriptionSidebar", () => {
	it("marks the selected transcription and renders compact metadata", () => {
		const html = renderToStaticMarkup(
			<TranscriptionSidebar
				items={[sampleListItem]}
				selectedId="tr_1"
				onSelect={() => {}}
				isLoading={false}
				error={null}
			/>,
		);

		expect(html).toContain("Meeting.m4a");
		expect(html).toContain("Completed");
		expect(html).toContain("Kickoff notes and next steps.");
		expect(html).toContain('aria-pressed="true"');
		expect(html).toContain('dateTime="2026-03-31T10:00:00.000Z"');
	});

	it("renders a retry state when the list query fails", () => {
		const html = renderToStaticMarkup(
			<TranscriptionSidebar
				items={[]}
				selectedId={null}
				onSelect={() => {}}
				isLoading={false}
				error={new Error("Failed to fetch transcriptions")}
				onRetry={() => {}}
			/>,
		);

		expect(html).toContain("Failed to fetch transcriptions");
		expect(html).toContain("Retry");
	});
});
