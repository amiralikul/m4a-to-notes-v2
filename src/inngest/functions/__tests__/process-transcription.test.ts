import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock services before importing the function
vi.mock("@/services", () => ({
	transcriptionsService: {
		findById: vi.fn(),
		markStarted: vi.fn(),
		updateProgress: vi.fn(),
		markCompleted: vi.fn(),
		markFailed: vi.fn(),
	},
	storageService: {
		downloadContent: vi.fn(),
		deleteObject: vi.fn(),
	},
	transcriptionAiService: {
		provider: "groq",
		transcribeAudio: vi.fn(),
		transcribeAudioFromUrl: vi.fn(),
	},
	assemblyAiService: {
		submit: vi.fn(),
		getTranscript: vi.fn(),
	},
}));

vi.mock("@/services/telegram", () => ({
	sendTelegramMessage: vi.fn(),
}));

vi.mock("@/lib/logger", () => ({
	logger: {
		info: vi.fn(),
		warn: vi.fn(),
		error: vi.fn(),
		debug: vi.fn(),
	},
}));

import {
	transcriptionsService,
	storageService,
	transcriptionAiService,
	assemblyAiService,
} from "@/services";
import { INNGEST_EVENTS } from "@/inngest/events";
import { sendTelegramMessage } from "@/services/telegram";

const mockSendEvent = vi.fn();

// Helper to simulate running the Inngest function handler directly
async function runProcessTranscription(transcriptionId: string) {
	// Import fresh to get mocked deps
	const { processTranscription } = await import("../process-transcription");

	// Extract the handler function from the Inngest function config
	const fn = processTranscription as unknown as {
		["~trigger"]: { event: string };
		fn: (args: { event: { data: { transcriptionId: string } }; step: { run: <T>(name: string, fn: () => Promise<T>) => Promise<T>; sleep: (name: string, duration: string) => Promise<void>; sendEvent: (id: string, payload: unknown) => Promise<void> }; logger: { info: typeof vi.fn; warn: typeof vi.fn; error: typeof vi.fn; debug: typeof vi.fn } }) => Promise<unknown>;
	};

	// Simple step.run that just executes the function
	const step = {
		run: async <T>(_name: string, handler: () => Promise<T>): Promise<T> => {
			return handler();
		},
		sleep: vi.fn().mockResolvedValue(undefined),
		sendEvent: mockSendEvent,
	};

	const logger = {
		info: vi.fn(),
		warn: vi.fn(),
		error: vi.fn(),
		debug: vi.fn(),
	};

	return fn.fn({
		event: { data: { transcriptionId } },
		step,
		logger,
	});
}

describe("process-transcription Inngest function", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockSendEvent.mockResolvedValue(undefined);
		(
			transcriptionAiService as unknown as {
				provider: "groq" | "openai";
			}
		).provider = "groq";
	});

	it("processes a pending transcription through completion", async () => {
		const mockTranscription = {
			id: "tx-1",
			status: "pending",
			audioKey: "https://blob.vercel/audio.m4a",
			filename: "test.m4a",
			source: "web",
			userMetadata: { userId: "user_1" },
		};

		vi.mocked(transcriptionsService.findById).mockResolvedValue(
			mockTranscription as unknown as Awaited<ReturnType<typeof transcriptionsService.findById>>,
		);
		vi.mocked(transcriptionAiService.transcribeAudioFromUrl).mockResolvedValue(
			"This is the transcribed text from the audio file.",
		);
		vi.mocked(transcriptionsService.markStarted).mockResolvedValue({} as never);
		vi.mocked(transcriptionsService.updateProgress).mockResolvedValue({} as never);
		vi.mocked(transcriptionsService.markCompleted).mockResolvedValue({} as never);

		const result = await runProcessTranscription("tx-1");

		expect(result).toEqual({
			status: "completed",
			transcriptionId: "tx-1",
			transcriptionLength: 49,
		});

		expect(transcriptionsService.markStarted).toHaveBeenCalledWith("tx-1", 5);
		expect(transcriptionAiService.transcribeAudioFromUrl).toHaveBeenCalledWith(
			"https://blob.vercel/audio.m4a",
		);
		expect(storageService.downloadContent).not.toHaveBeenCalled();
		expect(transcriptionsService.markCompleted).toHaveBeenCalledWith(
			"tx-1",
			expect.any(String),
			"This is the transcribed text from the audio file.",
		);
		expect(mockSendEvent).toHaveBeenCalledWith("request-summary", {
			name: INNGEST_EVENTS.TRANSCRIPTION_COMPLETED,
			data: { transcriptionId: "tx-1" },
			id: "summary-requested-tx-1",
		});
		expect(storageService.deleteObject).not.toHaveBeenCalled();
	});

	it("skips already completed transcription", async () => {
		vi.mocked(transcriptionsService.findById).mockResolvedValue({
			id: "tx-2",
			status: "completed",
			audioKey: "blob://audio.m4a",
		} as ReturnType<typeof transcriptionsService.findById> extends Promise<infer T> ? T : never);

		const result = await runProcessTranscription("tx-2");

		expect(result).toEqual({
			status: "skipped",
			transcriptionId: "tx-2",
		});

		expect(transcriptionsService.markStarted).not.toHaveBeenCalled();
		expect(storageService.downloadContent).not.toHaveBeenCalled();
		expect(mockSendEvent).not.toHaveBeenCalled();
	});

	it("skips already failed transcription", async () => {
		vi.mocked(transcriptionsService.findById).mockResolvedValue({
			id: "tx-3",
			status: "failed",
			audioKey: "blob://audio.m4a",
		} as ReturnType<typeof transcriptionsService.findById> extends Promise<infer T> ? T : never);

		const result = await runProcessTranscription("tx-3");

		expect(result).toEqual({
			status: "skipped",
			transcriptionId: "tx-3",
		});
	});

	it("sends Telegram notification for telegram-source transcription", async () => {
		const mockTranscription = {
			id: "tx-4",
			status: "pending",
			audioKey: "https://blob.vercel/telegram.m4a",
			filename: "voice.m4a",
			source: "telegram",
			userMetadata: { chatId: "12345" },
		};

		vi.mocked(transcriptionsService.findById).mockResolvedValue(
			mockTranscription as unknown as Awaited<ReturnType<typeof transcriptionsService.findById>>,
		);
		vi.mocked(transcriptionAiService.transcribeAudioFromUrl).mockResolvedValue(
			"Telegram transcript text",
		);
		vi.mocked(transcriptionsService.markStarted).mockResolvedValue({} as never);
		vi.mocked(transcriptionsService.updateProgress).mockResolvedValue({} as never);
		vi.mocked(transcriptionsService.markCompleted).mockResolvedValue({} as never);

		process.env.TELEGRAM_BOT_TOKEN = "test-bot-token";

		const result = await runProcessTranscription("tx-4");

		expect(result).toEqual({
			status: "completed",
			transcriptionId: "tx-4",
			transcriptionLength: 24,
		});

		expect(sendTelegramMessage).toHaveBeenCalledWith(
			"12345",
			"Telegram transcript text",
			"test-bot-token",
		);

		delete process.env.TELEGRAM_BOT_TOKEN;
	});

	it("does NOT send Telegram notification for web-source transcription", async () => {
		const mockTranscription = {
			id: "tx-5",
			status: "pending",
			audioKey: "https://blob.vercel/web.m4a",
			filename: "web.m4a",
			source: "web",
			userMetadata: { userId: "user_1" },
		};

		vi.mocked(transcriptionsService.findById).mockResolvedValue(
			mockTranscription as unknown as Awaited<ReturnType<typeof transcriptionsService.findById>>,
		);
		vi.mocked(transcriptionAiService.transcribeAudioFromUrl).mockResolvedValue(
			"Web transcript",
		);
		vi.mocked(transcriptionsService.markStarted).mockResolvedValue({} as never);
		vi.mocked(transcriptionsService.updateProgress).mockResolvedValue({} as never);
		vi.mocked(transcriptionsService.markCompleted).mockResolvedValue({} as never);

		await runProcessTranscription("tx-5");

		expect(sendTelegramMessage).not.toHaveBeenCalled();
	});

	it("does not delete audio blob after transcription (kept for dashboard)", async () => {
		const mockTranscription = {
			id: "tx-6",
			status: "pending",
			audioKey: "https://blob.vercel/audio.m4a",
			filename: "test.m4a",
			source: "web",
			userMetadata: {},
		};

		vi.mocked(transcriptionsService.findById).mockResolvedValue(
			mockTranscription as unknown as Awaited<ReturnType<typeof transcriptionsService.findById>>,
		);
		vi.mocked(transcriptionAiService.transcribeAudioFromUrl).mockResolvedValue(
			"Transcript text",
		);
		vi.mocked(transcriptionsService.markStarted).mockResolvedValue({} as never);
		vi.mocked(transcriptionsService.updateProgress).mockResolvedValue({} as never);
		vi.mocked(transcriptionsService.markCompleted).mockResolvedValue({} as never);

		await runProcessTranscription("tx-6");

		expect(storageService.deleteObject).not.toHaveBeenCalled();
		expect(transcriptionsService.markCompleted).toHaveBeenCalled();
	});

	describe("diarization path", () => {
		it("uses AssemblyAI when enableDiarization is true", async () => {
			const mockTranscription = {
				id: "tx-diar-1",
				status: "pending",
				audioKey: "https://blob.vercel/meeting.m4a",
				filename: "meeting.m4a",
				source: "web",
				enableDiarization: true,
				userMetadata: {},
			};

			vi.mocked(transcriptionsService.findById).mockResolvedValue(
				mockTranscription as unknown as Awaited<ReturnType<typeof transcriptionsService.findById>>,
			);
			vi.mocked(transcriptionsService.markStarted).mockResolvedValue({} as never);
			vi.mocked(transcriptionsService.updateProgress).mockResolvedValue({} as never);
			vi.mocked(transcriptionsService.markCompleted).mockResolvedValue({} as never);

			vi.mocked(assemblyAiService.submit).mockResolvedValue("aai-job-1");
			vi.mocked(assemblyAiService.getTranscript).mockResolvedValue({
				status: "completed",
				text: "Speaker A said hello. Speaker B replied.",
				segments: [
					{ speaker: "A", text: "Hello", start: 0, end: 1500 },
					{ speaker: "B", text: "Hi there", start: 1500, end: 3000 },
				],
			});

			const result = await runProcessTranscription("tx-diar-1");

			expect(result).toEqual({
				status: "completed",
				transcriptionId: "tx-diar-1",
				transcriptionLength: "Speaker A said hello. Speaker B replied.".length,
			});

			expect(assemblyAiService.submit).toHaveBeenCalledWith("https://blob.vercel/meeting.m4a");
			expect(assemblyAiService.getTranscript).toHaveBeenCalledWith("aai-job-1");
			expect(transcriptionsService.markCompleted).toHaveBeenCalledWith(
				"tx-diar-1",
				expect.any(String),
				"Speaker A said hello. Speaker B replied.",
				[
					{ speaker: "A", text: "Hello", start: 0, end: 1500 },
					{ speaker: "B", text: "Hi there", start: 1500, end: 3000 },
				],
			);
			// Should NOT use Groq/OpenAI
			expect(transcriptionAiService.transcribeAudioFromUrl).not.toHaveBeenCalled();
			expect(transcriptionAiService.transcribeAudio).not.toHaveBeenCalled();
		});

		it("throws NonRetriableError when AssemblyAI returns error", async () => {
			const mockTranscription = {
				id: "tx-diar-err",
				status: "pending",
				audioKey: "https://blob.vercel/bad.m4a",
				filename: "bad.m4a",
				source: "web",
				enableDiarization: true,
				userMetadata: {},
			};

			vi.mocked(transcriptionsService.findById).mockResolvedValue(
				mockTranscription as unknown as Awaited<ReturnType<typeof transcriptionsService.findById>>,
			);
			vi.mocked(transcriptionsService.markStarted).mockResolvedValue({} as never);
			vi.mocked(transcriptionsService.updateProgress).mockResolvedValue({} as never);

			vi.mocked(assemblyAiService.submit).mockResolvedValue("aai-job-err");
			vi.mocked(assemblyAiService.getTranscript).mockResolvedValue({
				status: "error",
				error: "Audio too short",
			});

			await expect(runProcessTranscription("tx-diar-err")).rejects.toThrow("Audio too short");
		});

		it("does not call AssemblyAI when enableDiarization is false", async () => {
			const mockTranscription = {
				id: "tx-no-diar",
				status: "pending",
				audioKey: "https://blob.vercel/audio.m4a",
				filename: "test.m4a",
				source: "web",
				enableDiarization: false,
				userMetadata: {},
			};

			vi.mocked(transcriptionsService.findById).mockResolvedValue(
				mockTranscription as unknown as Awaited<ReturnType<typeof transcriptionsService.findById>>,
			);
			vi.mocked(transcriptionAiService.transcribeAudioFromUrl).mockResolvedValue("Transcript text");
			vi.mocked(transcriptionsService.markStarted).mockResolvedValue({} as never);
			vi.mocked(transcriptionsService.updateProgress).mockResolvedValue({} as never);
			vi.mocked(transcriptionsService.markCompleted).mockResolvedValue({} as never);

			await runProcessTranscription("tx-no-diar");

			expect(assemblyAiService.submit).not.toHaveBeenCalled();
			expect(assemblyAiService.getTranscript).not.toHaveBeenCalled();
			expect(transcriptionAiService.transcribeAudioFromUrl).toHaveBeenCalled();
		});
	});

	it("falls back to file upload transcription for openai provider", async () => {
		const mockTranscription = {
			id: "tx-7",
			status: "pending",
			audioKey: "https://blob.vercel/audio-openai.m4a",
			filename: "openai.m4a",
			source: "web",
			userMetadata: { userId: "user_1" },
		};

		(
			transcriptionAiService as unknown as {
				provider: "groq" | "openai";
			}
		).provider = "openai";

		vi.mocked(transcriptionsService.findById).mockResolvedValue(
			mockTranscription as unknown as Awaited<ReturnType<typeof transcriptionsService.findById>>,
		);
		vi.mocked(storageService.downloadContent).mockResolvedValue(
			new ArrayBuffer(100),
		);
		vi.mocked(transcriptionAiService.transcribeAudio).mockResolvedValue(
			"OpenAI transcript",
		);
		vi.mocked(transcriptionsService.markStarted).mockResolvedValue({} as never);
		vi.mocked(transcriptionsService.updateProgress).mockResolvedValue({} as never);
		vi.mocked(transcriptionsService.markCompleted).mockResolvedValue({} as never);

		const result = await runProcessTranscription("tx-7");

		expect(result).toEqual({
			status: "completed",
			transcriptionId: "tx-7",
			transcriptionLength: "OpenAI transcript".length,
		});
		expect(storageService.downloadContent).toHaveBeenCalledWith(
			"https://blob.vercel/audio-openai.m4a",
		);
		expect(transcriptionAiService.transcribeAudio).toHaveBeenCalled();
		expect(
			transcriptionAiService.transcribeAudioFromUrl,
		).not.toHaveBeenCalled();
	});
});
