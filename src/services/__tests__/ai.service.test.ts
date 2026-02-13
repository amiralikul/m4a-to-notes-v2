import { describe, it, expect, vi, beforeEach } from "vitest";
import { createTestLogger } from "@/test/setup";
import { AiService, type AiServiceConfig, parseProvider } from "../ai.service";

// Capture constructor args and mock transcriptions.create
const mockCreate = vi.fn();
const mockConstructor = vi.fn();
vi.mock("openai", () => {
	class MockOpenAI {
		_opts: Record<string, unknown>;
		audio = { transcriptions: { create: mockCreate } };
		constructor(opts: Record<string, unknown>) {
			mockConstructor(opts);
			this._opts = opts;
		}
	}
	return { default: MockOpenAI };
});

const logger = createTestLogger();

function makeConfig(
	overrides: Partial<AiServiceConfig> = {},
): AiServiceConfig {
	return {
		provider: "groq",
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
			mockCreate.mockResolvedValueOnce({ text: "Hello world" });

			const service = new AiService(makeConfig({ provider: "groq" }), logger);
			const result = await service.transcribeAudio(new ArrayBuffer(100));

			expect(result).toBe("Hello world");
			expect(mockCreate).toHaveBeenCalledWith({
				file: expect.any(File),
				model: "whisper-large-v3-turbo",
			});
		});

		it("calls OpenAI model when provider is openai", async () => {
			mockCreate.mockResolvedValueOnce({ text: "Transcribed text" });

			const service = new AiService(
				makeConfig({ provider: "openai" }),
				logger,
			);
			const result = await service.transcribeAudio(new ArrayBuffer(50));

			expect(result).toBe("Transcribed text");
			expect(mockCreate).toHaveBeenCalledWith({
				file: expect.any(File),
				model: "whisper-1",
			});
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
