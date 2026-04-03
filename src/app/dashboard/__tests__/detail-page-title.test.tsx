import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TranscriptionWorkspacePane } from "@/components/dashboard/transcription-workspace-pane";

vi.mock("@/components/audio-player", () => ({
	AudioPlayer: () => <div>audio</div>,
}));

describe("Dashboard detail title", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("renders displayName in the detail header and shows the rename affordance", () => {
		const html = renderToStaticMarkup(
			<TranscriptionWorkspacePane
				activeTab="summary"
				onTabChange={() => {}}
				transcription={{
					id: "tr_1",
					transcriptionId: "tr_1",
					filename: "meeting.m4a",
					displayName: "Team Sync",
					status: "completed",
					progress: 100,
					createdAt: "2026-03-20T00:00:00.000Z",
					completedAt: "2026-03-20T00:05:00.000Z",
					preview: "preview",
					enableDiarization: false,
					diarizationData: null,
					transcriptText: "preview",
					summaryStatus: null,
					summaryUpdatedAt: null,
					audioKey: "",
					translationCount: 0,
					error: null,
					summaryError: null,
				}}
				summary={null}
				onRenameTranscription={async () => {}}
			/>,
		);

		expect(html).toContain("Team Sync");
		expect(html).toContain("Rename Team Sync");
	});

	it("falls back to filename in the detail header when displayName is null", () => {
		const html = renderToStaticMarkup(
			<TranscriptionWorkspacePane
				activeTab="summary"
				onTabChange={() => {}}
				transcription={{
					id: "tr_1",
					transcriptionId: "tr_1",
					filename: "fallback.m4a",
					displayName: null,
					status: "completed",
					progress: 100,
					createdAt: "2026-03-20T00:00:00.000Z",
					completedAt: "2026-03-20T00:05:00.000Z",
					preview: "preview",
					enableDiarization: false,
					diarizationData: null,
					transcriptText: "preview",
					summaryStatus: null,
					summaryUpdatedAt: null,
					audioKey: "",
					translationCount: 0,
					error: null,
					summaryError: null,
				}}
				summary={null}
				onRenameTranscription={async () => {}}
			/>,
		);

		expect(html).toContain("fallback.m4a");
		expect(html).toContain("Rename fallback.m4a");
	});
});
