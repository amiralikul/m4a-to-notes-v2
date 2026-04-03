import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
	DashboardUploadProgressTray,
	type DashboardUploadProgressItem,
} from "../dashboard-upload-progress-tray";

const progressItems: DashboardUploadProgressItem[] = [
	{
		id: "uploading",
		filename: "customer-sync.m4a",
		status: "uploading",
		progress: 42,
		statusLabel: "Uploading",
		detail: "42% uploaded",
		canRemove: false,
	},
	{
		id: "error",
		filename: "retro-notes.mp3",
		status: "error",
		progress: 0,
		statusLabel: "Error occurred",
		detail: "Could not upload file. Please try again.",
		error: "Could not upload file. Please try again.",
		canRetry: true,
		canRemove: true,
	},
	{
		id: "done",
		filename: "weekly-review.wav",
		status: "completed",
		progress: 100,
		statusLabel: "Completed",
		detail: "Ready in dashboard",
		canRemove: true,
	},
];

describe("DashboardUploadProgressTray", () => {
	it("renders dense progress rows with thin progress bars and row-level actions", () => {
		const html = renderToStaticMarkup(
			<DashboardUploadProgressTray
				items={progressItems}
				onRetry={() => {}}
				onRemove={() => {}}
			/>,
		);

		expect(html).toContain("Upload activity");
		expect(html).toContain("customer-sync.m4a");
		expect(html).toContain("Uploading");
		expect(html).toContain("42% uploaded");
		expect(html).toContain("weekly-review.wav");
		expect(html).toContain("Ready in dashboard");
		expect(html).toContain("h-1.5");
		expect(html).toContain('aria-label="Retry retro-notes.mp3"');
		expect(html).toContain('aria-label="Remove retro-notes.mp3"');
		expect(html).toContain('aria-label="Remove weekly-review.wav"');
		expect(html).not.toContain('aria-label="Retry customer-sync.m4a"');
		expect(html).not.toContain('aria-label="Remove customer-sync.m4a"');
	});
});
