import { describe, it, expect } from "vitest";
import { validateAudioFile, AUDIO_LIMITS } from "../validation";

describe("validateAudioFile", () => {
	it("accepts valid m4a file", () => {
		const result = validateAudioFile({
			size: 1024 * 1024, // 1MB
			type: "audio/mp4",
			name: "recording.m4a",
		});
		expect(result.valid).toBe(true);
		expect(result.error).toBeUndefined();
	});

	it("accepts all valid MIME types", () => {
		for (const mimeType of AUDIO_LIMITS.VALID_MIME_TYPES) {
			const result = validateAudioFile({
				size: 1024,
				type: mimeType,
				name: "test.m4a",
			});
			expect(result.valid).toBe(true);
		}
	});

	it("accepts files by extension when MIME type is unknown", () => {
		for (const ext of AUDIO_LIMITS.VALID_EXTENSIONS) {
			const result = validateAudioFile({
				size: 1024,
				type: "application/octet-stream",
				name: `audio${ext}`,
			});
			expect(result.valid).toBe(true);
		}
	});

	it("rejects file exceeding size limit", () => {
		const result = validateAudioFile({
			size: 101 * 1024 * 1024, // 101MB
			type: "audio/mp4",
			name: "large.m4a",
		});
		expect(result.valid).toBe(false);
		expect(result.error).toContain("100MB");
	});

	it("accepts file at exact size limit", () => {
		const result = validateAudioFile({
			size: AUDIO_LIMITS.MAX_FILE_SIZE,
			type: "audio/mp4",
			name: "exact.m4a",
		});
		expect(result.valid).toBe(true);
	});

	it("rejects unsupported format", () => {
		const result = validateAudioFile({
			size: 1024,
			type: "video/mp4",
			name: "video.mp4",
		});
		expect(result.valid).toBe(false);
		expect(result.error).toContain("Unsupported");
	});

	it("rejects filename that is too long", () => {
		const result = validateAudioFile({
			size: 1024,
			type: "audio/mp4",
			name: `${"a".repeat(256)}.m4a`,
		});
		expect(result.valid).toBe(false);
		expect(result.error).toContain("Filename too long");
	});

	it("accepts filename at max length", () => {
		const result = validateAudioFile({
			size: 1024,
			type: "audio/mp4",
			name: `${"a".repeat(251)}.m4a`, // 251 + 4 = 255
		});
		expect(result.valid).toBe(true);
	});
});
