import { beforeEach, describe, expect, it, vi } from "vitest";
import { createTestLogger } from "@/test/setup";
import {
	type TextAiServiceConfig,
	TextAiService,
	parseTextAiProvider,
} from "@/services/ai";
import {
	type TranscriptionAiServiceConfig,
	TranscriptionAiService,
	parseTranscriptionProvider,
} from "@/services/ai";

const mockTranscriptionCreate = vi.fn();
const mockSummaryCreate = vi.fn();
const mockConstructor = vi.fn();
const mockFetch = vi.fn();

vi.stubGlobal("fetch", mockFetch);
vi.mock("openai", () => {
	class MockOpenAI {
		_opts: Record<string, unknown>;
		audio = { transcriptions: { create: mockTranscriptionCreate } };
		chat = { completions: { create: mockSummaryCreate } };
		constructor(opts: Record<string, unknown>) {
			mockConstructor(opts);
			this._opts = opts;
		}
	}
	return { default: MockOpenAI };
});

const logger = createTestLogger();

function makeTranscriptionConfig(
	overrides: Partial<TranscriptionAiServiceConfig> = {},
): TranscriptionAiServiceConfig {
	return {
		provider: "groq",
		groqKey: "gsk_test_key",
		openaiKey: "sk-test_key",
		...overrides,
	};
}

function makeTextConfig(
	overrides: Partial<TextAiServiceConfig> = {},
): TextAiServiceConfig {
	return {
		provider: "openai",
		openaiKey: "sk-test_key",
		...overrides,
	};
}

describe("TranscriptionAiService", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("constructor", () => {
		it("configures Groq provider with correct model", () => {
			const service = new TranscriptionAiService(
				makeTranscriptionConfig({ provider: "groq" }),
				logger,
			);

			expect(mockConstructor).not.toHaveBeenCalled();
			expect(service.provider).toBe("groq");
			expect(service.model).toBe("whisper-large-v3");
		});

		it("configures OpenAI provider with correct model", () => {
			const service = new TranscriptionAiService(
				makeTranscriptionConfig({ provider: "openai" }),
				logger,
			);

			expect(mockConstructor).not.toHaveBeenCalled();
			expect(service.provider).toBe("openai");
			expect(service.model).toBe("whisper-1");
		});

		it("defers missing key validation until transcription call", async () => {
			const groqService = new TranscriptionAiService(
				makeTranscriptionConfig({ provider: "groq", groqKey: "" }),
				logger,
			);
			await expect(
				groqService.transcribeAudio(new ArrayBuffer(10)),
			).rejects.toThrow(
				'Failed to transcribe audio: Missing API key for transcription provider "groq"',
			);

			const openaiService = new TranscriptionAiService(
				makeTranscriptionConfig({ provider: "openai", openaiKey: "" }),
				logger,
			);
			await expect(
				openaiService.transcribeAudio(new ArrayBuffer(10)),
			).rejects.toThrow(
				'Failed to transcribe audio: Missing API key for transcription provider "openai"',
			);
		});
	});

	describe("transcribeAudio", () => {
		it("calls client with the correct model", async () => {
			mockTranscriptionCreate.mockResolvedValueOnce({ text: "Hello world" });

			const service = new TranscriptionAiService(
				makeTranscriptionConfig({ provider: "groq" }),
				logger,
			);
			const result = await service.transcribeAudio(new ArrayBuffer(100));

			expect(result).toBe("Hello world");
			expect(mockTranscriptionCreate).toHaveBeenCalledWith({
				file: expect.any(File),
				model: "whisper-large-v3",
			});
		});

		it("calls OpenAI model when provider is openai", async () => {
			mockTranscriptionCreate.mockResolvedValueOnce({ text: "Transcribed text" });

			const service = new TranscriptionAiService(
				makeTranscriptionConfig({ provider: "openai" }),
				logger,
			);
			const result = await service.transcribeAudio(new ArrayBuffer(50));

			expect(result).toBe("Transcribed text");
			expect(mockTranscriptionCreate).toHaveBeenCalledWith({
				file: expect.any(File),
				model: "whisper-1",
			});
		});
	});

	describe("transcribeAudioFromUrl", () => {
		it("sends audio URL to Groq transcription endpoint", async () => {
			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: vi.fn().mockResolvedValue({ text: "Transcript from url" }),
			} as unknown as Response);

			const service = new TranscriptionAiService(
				makeTranscriptionConfig({ provider: "groq" }),
				logger,
			);
			const result = await service.transcribeAudioFromUrl(
				"https://blob.vercel-storage.com/audio.m4a",
			);

			expect(result).toBe("Transcript from url");
			expect(mockFetch).toHaveBeenCalledTimes(1);
			const [requestUrl, requestInit] = mockFetch.mock.calls[0] as [
				string,
				RequestInit,
			];

			expect(requestUrl).toBe("https://api.groq.com/openai/v1/audio/transcriptions");
			expect(requestInit.method).toBe("POST");
			expect(requestInit.headers).toEqual({
				Authorization: "Bearer gsk_test_key",
			});
			expect(requestInit.body).toBeInstanceOf(FormData);

			const body = requestInit.body as FormData;
			expect(body.get("model")).toBe("whisper-large-v3");
			expect(body.get("url")).toBe("https://blob.vercel-storage.com/audio.m4a");
		});

		it("wraps Groq url transcription errors", async () => {
			mockFetch.mockResolvedValueOnce({
				ok: false,
				status: 400,
				text: vi.fn().mockResolvedValue("bad request"),
			} as unknown as Response);

			const service = new TranscriptionAiService(
				makeTranscriptionConfig({ provider: "groq" }),
				logger,
			);

			await expect(
				service.transcribeAudioFromUrl("https://blob.vercel-storage.com/bad.m4a"),
			).rejects.toThrow("Failed to transcribe audio: Groq API error (400)");
		});

		it("throws when provider is openai", async () => {
			const service = new TranscriptionAiService(
				makeTranscriptionConfig({ provider: "openai" }),
				logger,
			);

			await expect(
				service.transcribeAudioFromUrl("https://blob.vercel-storage.com/audio.m4a"),
			).rejects.toThrow(
				'URL-based transcription is only supported for "groq" provider',
			);
			expect(mockFetch).not.toHaveBeenCalled();
		});
	});
});

describe("TextAiService", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("returns validated structured summary", async () => {
		mockSummaryCreate.mockResolvedValueOnce({
			choices: [
				{
					message: {
						content: JSON.stringify({
							summary: "Sprint planning reviewed blockers.",
							keyPoints: ["Blockers reviewed", "Timeline adjusted"],
							actionItems: [{ task: "Update roadmap", owner: "Sam" }],
							keyTakeaways: ["Team aligned on priorities"],
						}),
					},
				},
			],
		});

		const service = new TextAiService(makeTextConfig(), logger);
		const result = await service.generateSummary("Transcript content");

		expect(result.summary).toContain("Sprint planning");
		expect(result.keyPoints).toHaveLength(2);
		expect(result.actionItems[0]?.task).toBe("Update roadmap");
		expect(mockConstructor).toHaveBeenCalledTimes(1);
		expect(mockSummaryCreate).toHaveBeenCalled();
	});

	it("fails when OpenAI key is missing for summary generation", async () => {
		const service = new TextAiService(
			makeTextConfig({ openaiKey: "" }),
			logger,
		);

		await expect(service.generateSummary("Transcript content")).rejects.toThrow(
			'Missing API key for summary provider "openai"',
		);
	});
});

describe("parseTranscriptionProvider", () => {
	it('defaults to "groq" when value is undefined', () => {
		expect(parseTranscriptionProvider(undefined)).toBe("groq");
	});

	it('defaults to "groq" when value is empty string', () => {
		expect(parseTranscriptionProvider("")).toBe("groq");
	});

	it('accepts "groq"', () => {
		expect(parseTranscriptionProvider("groq")).toBe("groq");
	});

	it('accepts "openai"', () => {
		expect(parseTranscriptionProvider("openai")).toBe("openai");
	});

	it("rejects invalid values", () => {
		expect(() => parseTranscriptionProvider("azure")).toThrow(
			'Invalid TRANSCRIPTION_PROVIDER "azure"',
		);
	});
});

describe("parseTextAiProvider", () => {
	it('defaults to "openai" when value is undefined', () => {
		expect(parseTextAiProvider(undefined)).toBe("openai");
	});

	it('accepts "openai"', () => {
		expect(parseTextAiProvider("openai")).toBe("openai");
	});

	it("rejects invalid values", () => {
		expect(() => parseTextAiProvider("anthropic")).toThrow(
			'Invalid SUMMARY_PROVIDER "anthropic"',
		);
	});
});
