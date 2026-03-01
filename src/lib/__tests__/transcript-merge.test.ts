import { describe, expect, it } from "vitest";
import { mergeChunkTranscripts } from "@/lib/transcript-merge";

describe("mergeChunkTranscripts", () => {
	it("joins chunks with no overlap", () => {
		const merged = mergeChunkTranscripts([
			{ chunkIndex: 0, text: "Hello there." },
			{ chunkIndex: 1, text: "How are you?" },
		]);

		expect(merged).toBe("Hello there. How are you?");
	});

	it("deduplicates overlapping boundary words", () => {
		const merged = mergeChunkTranscripts([
			{ chunkIndex: 0, text: "Today we will discuss the project timeline" },
			{ chunkIndex: 1, text: "the project timeline and next milestones" },
		]);

		expect(merged).toBe(
			"Today we will discuss the project timeline and next milestones",
		);
	});

	it("sorts by chunkIndex before merging", () => {
		const merged = mergeChunkTranscripts([
			{ chunkIndex: 2, text: "third part" },
			{ chunkIndex: 0, text: "first part" },
			{ chunkIndex: 1, text: "second part" },
		]);

		expect(merged).toBe("first part second part third part");
	});

	it("deduplicates overlapping boundary words in Hebrew", () => {
		const merged = mergeChunkTranscripts([
			{ chunkIndex: 0, text: "זה מאוד חשוב לנו שאם אנחנו עובדים תרגיל בית" },
			{ chunkIndex: 1, text: "שאם אנחנו עובדים תרגיל בית אז לפחות זה משהו שיקדם אותך" },
		]);

		expect(merged).toBe(
			"זה מאוד חשוב לנו שאם אנחנו עובדים תרגיל בית אז לפחות זה משהו שיקדם אותך",
		);
	});
});
