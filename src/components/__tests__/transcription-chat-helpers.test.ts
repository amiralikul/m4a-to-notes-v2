import { describe, expect, it } from "vitest";
import {
	canSendStarterPrompt,
	shouldSubmitOnEnter,
} from "../transcription-chat-helpers";

describe("transcription chat helpers", () => {
	it("blocks starter prompts while history is loading or a request is in flight", () => {
		expect(
			canSendStarterPrompt({
				loadingHistory: true,
				isSubmitting: false,
			}),
		).toBe(false);
		expect(
			canSendStarterPrompt({
				loadingHistory: false,
				isSubmitting: true,
			}),
		).toBe(false);
		expect(
			canSendStarterPrompt({
				loadingHistory: false,
				isSubmitting: false,
			}),
		).toBe(true);
	});

	it("does not submit on Enter while IME composition is active", () => {
		expect(
			shouldSubmitOnEnter({
				key: "Enter",
				shiftKey: false,
				isComposing: true,
			}),
		).toBe(false);
		expect(
			shouldSubmitOnEnter({
				key: "Enter",
				shiftKey: true,
				isComposing: false,
			}),
		).toBe(false);
		expect(
			shouldSubmitOnEnter({
				key: "Enter",
				shiftKey: false,
				isComposing: false,
			}),
		).toBe(true);
	});
});
