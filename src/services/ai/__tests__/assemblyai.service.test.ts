import { describe, it, expect, vi, beforeEach } from "vitest";

const mockTranscripts = {
	submit: vi.fn(),
	get: vi.fn(),
};

vi.mock("assemblyai", () => {
	return {
		AssemblyAI: class MockAssemblyAI {
			transcripts = mockTranscripts;
		},
	};
});

import { AssemblyAiService } from "../assemblyai.service";

function createService() {
	const logger = {
		info: vi.fn(),
		warn: vi.fn(),
		error: vi.fn(),
		debug: vi.fn(),
	};
	return {
		service: new AssemblyAiService({ apiKey: "test-key" }, logger as never),
		logger,
	};
}

describe("AssemblyAiService", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("submit", () => {
		it("submits audio URL and returns job ID", async () => {
			const { service } = createService();
			mockTranscripts.submit.mockResolvedValue({ id: "job-123" });

			const jobId = await service.submit("https://blob.vercel/audio.m4a");

			expect(jobId).toBe("job-123");
			expect(mockTranscripts.submit).toHaveBeenCalledWith({
				audio: "https://blob.vercel/audio.m4a",
				speaker_labels: true,
				speech_models: ["universal-2"],
			});
		});

		it("throws when API key is missing", async () => {
			const logger = { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() };
			const service = new AssemblyAiService({ apiKey: "" }, logger as never);

			await expect(service.submit("https://example.com/audio.m4a")).rejects.toThrow(
				"Missing ASSEMBLYAI_API_KEY",
			);
		});

		it("throws on API error", async () => {
			const { service } = createService();
			mockTranscripts.submit.mockRejectedValue(new Error("API error"));

			await expect(service.submit("https://example.com/audio.m4a")).rejects.toThrow("API error");
		});
	});

	describe("getTranscript", () => {
		it("returns completed result with segments", async () => {
			const { service } = createService();
			mockTranscripts.get.mockResolvedValue({
				status: "completed",
				text: "Hello world",
				utterances: [
					{ speaker: "A", text: "Hello", start: 0, end: 1500 },
					{ speaker: "B", text: "World", start: 1500, end: 3000 },
				],
			});

			const result = await service.getTranscript("job-123");

			expect(result).toEqual({
				status: "completed",
				text: "Hello world",
				segments: [
					{ speaker: "A", text: "Hello", start: 0, end: 1500 },
					{ speaker: "B", text: "World", start: 1500, end: 3000 },
				],
			});
		});

		it("returns null segments when utterances are empty", async () => {
			const { service } = createService();
			mockTranscripts.get.mockResolvedValue({
				status: "completed",
				text: "Monologue text",
				utterances: [],
			});

			const result = await service.getTranscript("job-456");

			expect(result).toEqual({
				status: "completed",
				text: "Monologue text",
				segments: null,
			});
		});

		it("returns null segments when utterances is null", async () => {
			const { service } = createService();
			mockTranscripts.get.mockResolvedValue({
				status: "completed",
				text: "Text only",
				utterances: null,
			});

			const result = await service.getTranscript("job-789");

			expect(result).toEqual({
				status: "completed",
				text: "Text only",
				segments: null,
			});
		});

		it("returns queued status", async () => {
			const { service } = createService();
			mockTranscripts.get.mockResolvedValue({ status: "queued" });

			const result = await service.getTranscript("job-queued");

			expect(result).toEqual({ status: "queued" });
		});

		it("returns processing status", async () => {
			const { service } = createService();
			mockTranscripts.get.mockResolvedValue({ status: "processing" });

			const result = await service.getTranscript("job-processing");

			expect(result).toEqual({ status: "processing" });
		});

		it("returns error status with message", async () => {
			const { service } = createService();
			mockTranscripts.get.mockResolvedValue({
				status: "error",
				error: "Audio too short",
			});

			const result = await service.getTranscript("job-error");

			expect(result).toEqual({
				status: "error",
				error: "Audio too short",
			});
		});

		it("returns default error when error message is missing", async () => {
			const { service } = createService();
			mockTranscripts.get.mockResolvedValue({
				status: "error",
				error: null,
			});

			const result = await service.getTranscript("job-error-null");

			expect(result).toEqual({
				status: "error",
				error: "Unknown AssemblyAI error",
			});
		});
	});
});
