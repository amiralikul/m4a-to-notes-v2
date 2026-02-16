import { beforeEach, describe, expect, it, vi } from "vitest";
import { createTestLogger } from "@/test/setup";
import {
	AiService,
	type AiServiceConfig,
	parseProvider,
	parseSummaryProvider,
} from "../ai.service";

const mockTranscriptionCreate = vi.fn();
const mockSummaryCreate = vi.fn();
const mockConstructor = vi.fn();
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

function makeConfig(overrides: Partial<AiServiceConfig> = {}): AiServiceConfig {
	return {
		provider: "groq",
		summaryProvider: "openai",
		groqKey: "gsk_test_key",
		openaiKey: "sk-test_key",
		...overrides,
	};
}

describe("AiService", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("constructor", () => {
		it("configures Groq provider with correct baseURL and model", () => {
			const service = new AiService(makeConfig({ provider: "groq" }), logger);

			expect(mockConstructor).toHaveBeenCalledWith({
				apiKey: "gsk_test_key",
				baseURL: "https://api.groq.com/openai/v1",
			});
			expect(service.provider).toBe("groq");
			expect(service.model).toBe("whisper-large-v3-turbo");
			expect(service.summaryProvider).toBe("openai");
			expect(service.summaryModel).toBe("gpt-5-mini");
		});

		it("configures OpenAI provider with default baseURL and model", () => {
			const service = new AiService(
				makeConfig({ provider: "openai" }),
				logger,
			);

			expect(mockConstructor).toHaveBeenCalledWith({
				apiKey: "sk-test_key",
				baseURL: undefined,
			});
			expect(service.provider).toBe("openai");
			expect(service.model).toBe("whisper-1");
		});

		it("throws when Groq key is missing for groq provider", () => {
			expect(
				() =>
					new AiService(makeConfig({ provider: "groq", groqKey: "" }), logger),
			).toThrow('Missing API key for transcription provider "groq"');
		});

		it("throws when OpenAI key is missing for openai provider", () => {
			expect(
				() =>
					new AiService(
						makeConfig({ provider: "openai", openaiKey: "" }),
						logger,
					),
			).toThrow('Missing API key for transcription provider "openai"');
		});
	});

	describe("transcribeAudio", () => {
		it("calls client with the correct model", async () => {
			mockTranscriptionCreate.mockResolvedValueOnce({ text: "Hello world" });

			const service = new AiService(makeConfig({ provider: "groq" }), logger);
			const result = await service.transcribeAudio(new ArrayBuffer(100));

			expect(result).toBe("Hello world");
			expect(mockTranscriptionCreate).toHaveBeenCalledWith({
				file: expect.any(File),
				model: "whisper-large-v3-turbo",
			});
		});

		it("calls OpenAI model when provider is openai", async () => {
			mockTranscriptionCreate.mockResolvedValueOnce({ text: "Transcribed text" });

			const service = new AiService(
				makeConfig({ provider: "openai" }),
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

	describe("generateSummary", () => {
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

			const service = new AiService(makeConfig(), logger);
			const result = await service.generateSummary("Transcript content");

			expect(result.summary).toContain("Sprint planning");
			expect(result.keyPoints).toHaveLength(2);
			expect(result.actionItems[0]?.task).toBe("Update roadmap");
			expect(mockConstructor).toHaveBeenCalledTimes(2);
			expect(mockSummaryCreate).toHaveBeenCalled();
		});

		it("fails when OpenAI key is missing for summary generation", async () => {
			const service = new AiService(
				makeConfig({ provider: "groq", openaiKey: "" }),
				logger,
			);

			await expect(
				service.generateSummary("Transcript content"),
			).rejects.toThrow('Missing API key for summary provider "openai"');
		});
	});
});

describe("parseProvider", () => {
	it('defaults to "groq" when value is undefined', () => {
		expect(parseProvider(undefined)).toBe("groq");
	});

	it('defaults to "groq" when value is empty string', () => {
		expect(parseProvider("")).toBe("groq");
	});

	it('accepts "groq"', () => {
		expect(parseProvider("groq")).toBe("groq");
	});

	it('accepts "openai"', () => {
		expect(parseProvider("openai")).toBe("openai");
	});

	it("rejects invalid values", () => {
		expect(() => parseProvider("azure")).toThrow(
			'Invalid TRANSCRIPTION_PROVIDER "azure"',
		);
	});
});

describe("parseSummaryProvider", () => {
	it('defaults to "openai" when value is undefined', () => {
		expect(parseSummaryProvider(undefined)).toBe("openai");
	});

	it('accepts "openai"', () => {
		expect(parseSummaryProvider("openai")).toBe("openai");
	});

	it("rejects invalid values", () => {
		expect(() => parseSummaryProvider("anthropic")).toThrow(
			'Invalid SUMMARY_PROVIDER "anthropic"',
		);
	});
});
