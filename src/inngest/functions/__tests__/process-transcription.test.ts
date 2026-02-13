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
	aiService: {
		transcribeAudio: vi.fn(),
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
	aiService,
} from "@/services";
import { sendTelegramMessage } from "@/services/telegram";

// Helper to simulate running the Inngest function handler directly
async function runProcessTranscription(transcriptionId: string) {
	// Import fresh to get mocked deps
	const { processTranscription } = await import("../process-transcription");

	// Extract the handler function from the Inngest function config
	const fn = processTranscription as unknown as {
		["~trigger"]: { event: string };
		fn: (args: { event: { data: { transcriptionId: string } }; step: { run: <T>(name: string, fn: () => Promise<T>) => Promise<T> } }) => Promise<unknown>;
	};

	// Simple step.run that just executes the function
	const step = {
		run: async <T>(_name: string, handler: () => Promise<T>): Promise<T> => {
			return handler();
		},
	};

	return fn.fn({
		event: { data: { transcriptionId } },
		step,
	});
}

describe("process-transcription Inngest function", () => {
	beforeEach(() => {
		vi.clearAllMocks();
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
		vi.mocked(storageService.downloadContent).mockResolvedValue(
			new ArrayBuffer(100),
		);
		vi.mocked(aiService.transcribeAudio).mockResolvedValue(
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
		expect(storageService.downloadContent).toHaveBeenCalledWith(
			"https://blob.vercel/audio.m4a",
		);
		expect(aiService.transcribeAudio).toHaveBeenCalled();
		expect(transcriptionsService.markCompleted).toHaveBeenCalledWith(
			"tx-1",
			expect.any(String),
			"This is the transcribed text from the audio file.",
		);
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
		vi.mocked(storageService.downloadContent).mockResolvedValue(
			new ArrayBuffer(50),
		);
		vi.mocked(aiService.transcribeAudio).mockResolvedValue("Telegram transcript text");
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
		vi.mocked(storageService.downloadContent).mockResolvedValue(
			new ArrayBuffer(50),
		);
		vi.mocked(aiService.transcribeAudio).mockResolvedValue("Web transcript");
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
		vi.mocked(storageService.downloadContent).mockResolvedValue(
			new ArrayBuffer(50),
		);
		vi.mocked(aiService.transcribeAudio).mockResolvedValue("Transcript text");
		vi.mocked(transcriptionsService.markStarted).mockResolvedValue({} as never);
		vi.mocked(transcriptionsService.updateProgress).mockResolvedValue({} as never);
		vi.mocked(transcriptionsService.markCompleted).mockResolvedValue({} as never);

		await runProcessTranscription("tx-6");

		expect(storageService.deleteObject).not.toHaveBeenCalled();
		expect(transcriptionsService.markCompleted).toHaveBeenCalled();
	});
});
