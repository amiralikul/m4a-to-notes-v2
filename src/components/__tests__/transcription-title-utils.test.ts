import { describe, expect, it } from "vitest";
import { getTranscriptionTitle } from "@/components/transcription-title-utils";

describe("getTranscriptionTitle", () => {
	it("returns filename when displayName is null", () => {
		expect(getTranscriptionTitle(null, "meeting.m4a")).toBe("meeting.m4a");
	});

	it("returns trimmed displayName when present", () => {
		expect(getTranscriptionTitle("  Team Sync  ", "meeting.m4a")).toBe(
			"Team Sync",
		);
	});

	it("never returns an empty string when filename exists", () => {
		expect(getTranscriptionTitle("   ", "meeting.m4a")).toBe("meeting.m4a");
	});
});
