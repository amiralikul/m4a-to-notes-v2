import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import {
	getOriginalFilenameLabel,
	TranscriptionTitleEditor,
	validateDisplayNameDraft,
} from "@/components/transcription-title-editor";

describe("TranscriptionTitleEditor", () => {
	it("renders the resolved display title in read mode", () => {
		const html = renderToStaticMarkup(
			<TranscriptionTitleEditor
				displayName="Team Sync"
				filename="meeting.m4a"
				onSave={vi.fn()}
			/>,
		);

		expect(html).toContain("Team Sync");
		expect(html).toContain("meeting.m4a");
	});

	it("does not show the original filename when the resolved title matches it", () => {
		expect(getOriginalFilenameLabel(" meeting.m4a ", "meeting.m4a")).toBeNull();
	});

	it("does not show the original filename for whitespace-only display names", () => {
		expect(getOriginalFilenameLabel("   ", "meeting.m4a")).toBeNull();
	});

	it("shows the original filename when the resolved title differs", () => {
		expect(getOriginalFilenameLabel("Team Sync", "meeting.m4a")).toBe(
			"meeting.m4a",
		);
	});

	it("rejects whitespace-only drafts", () => {
		expect(validateDisplayNameDraft("   ")).toBe("Display name cannot be empty");
	});

	it("accepts non-empty drafts after trimming", () => {
		expect(validateDisplayNameDraft("  Team Sync  ")).toBeNull();
	});
});
