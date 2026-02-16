import { Bot, type Context, webhookCallback } from "grammy";
import {
	transcriptionsService,
	conversationService,
	storageService,
	workflowService,
} from "@/services";
import { getChatCompletion } from "@/services/chat";
import { getErrorMessage } from "@/lib/errors";
import { AUDIO_LIMITS } from "@/lib/validation";
import { logger } from "@/lib/logger";

// Cache botInfo on globalThis to avoid getMe() on every request (#4)
const globalForBot = globalThis as unknown as {
	// biome-ignore lint: Grammy internal type
	botInfo: any;
};

export async function POST(request: Request) {
	const botToken = process.env.TELEGRAM_BOT_TOKEN;
	if (!botToken) {
		return Response.json(
			{ error: "Bot token not configured" },
			{ status: 500 },
		);
	}

	// Verify request token
	const url = new URL(request.url);
	const token = url.searchParams.get("token");
	if (token !== botToken) {
		return Response.json({ error: "Invalid token" }, { status: 401 });
	}

	if (!globalForBot.botInfo) {
		const tempBot = new Bot(botToken);
		await tempBot.init();
		globalForBot.botInfo = tempBot.botInfo;
	}

	const bot = new Bot(botToken, { botInfo: globalForBot.botInfo });

	// /start command
	bot.command("start", async (ctx) => {
		await ctx.reply(
			"Welcome to AudioScribe! Send me an audio file and I'll transcribe it for you.\n\n" +
				"Supported formats: M4A, MP3, WAV, OGG, AAC, WebM\n" +
				"Max file size: 25MB",
		);
	});

	// /help command
	bot.command("help", async (ctx) => {
		await ctx.reply(
			"How to use AudioScribe:\n\n" +
				"1. Send me an audio file\n" +
				"2. Wait for the transcription\n" +
				"3. Ask me questions about the transcription\n\n" +
				"Supported formats: M4A, MP3, WAV, OGG, AAC, WebM\n" +
				"Max file size: 25MB",
		);
	});

	// Handle audio messages
	bot.on("message:audio", async (ctx) => {
		await handleFileProcessing(ctx, ctx.message.audio);
	});

	bot.on("message:voice", async (ctx) => {
		await handleFileProcessing(ctx, ctx.message.voice);
	});

	// Handle document messages (check if audio)
	bot.on("message:document", async (ctx) => {
		const doc = ctx.message.document;
		if (doc.mime_type?.startsWith("audio/")) {
			await handleFileProcessing(ctx, doc);
		} else {
			await ctx.reply(
				"Please send an audio file. Supported formats: M4A, MP3, WAV, OGG, AAC, WebM",
			);
		}
	});

	// Handle text messages with conversation context
	bot.on("message:text", async (ctx) => {
		const chatId = ctx.chat.id.toString();
		const text = ctx.message.text;

		try {
			const conversation =
				await conversationService.getConversation(chatId);

			if (!conversationService.hasRecentTranscriptions(conversation)) {
				await ctx.reply(
					"Send me an audio file first, then you can ask questions about it!",
				);
				return;
			}

			await conversationService.addUserMessage(
				chatId,
				text,
				ctx.message.message_id.toString(),
			);

			const contextMessages =
				conversationService.getContextForLLM(conversation);

			const apiKey = process.env.OPENAI_API_KEY;
			if (!apiKey) {
				await ctx.reply("AI service is not configured.");
				return;
			}

			const response = await getChatCompletion(
				[...contextMessages, { role: "user", content: text }],
				apiKey,
				logger,
			);

			await conversationService.addBotResponse(chatId, response);
			await ctx.reply(response);
		} catch (error) {
			logger.error("Text handler error", {
				chatId,
				error: getErrorMessage(error),
			});
			await ctx.reply("Sorry, something went wrong. Please try again.");
		}
	});

	const handler = webhookCallback(bot, "std/http");
	return handler(request);
}

// (#1) Rewritten: upload to Blob → create DB record → trigger workflow
async function handleFileProcessing(
	ctx: Context,
	fileInfo: { file_id: string; file_size?: number; file_name?: string },
) {
	const chatId = ctx.chat?.id.toString();
	if (!chatId) return;

	try {
		if (
			fileInfo.file_size &&
			fileInfo.file_size > AUDIO_LIMITS.MAX_FILE_SIZE
		) {
			await ctx.reply(
				`File is too large. Maximum size is ${AUDIO_LIMITS.MAX_FILE_SIZE / 1024 / 1024}MB.`,
			);
			return;
		}

		await ctx.reply("Processing your audio file...");

		// Download file from Telegram
		const file = await ctx.api.getFile(fileInfo.file_id);
		const fileUrl = `https://api.telegram.org/file/bot${process.env.TELEGRAM_BOT_TOKEN}/${file.file_path}`;
		const response = await fetch(fileUrl);
		const audioBuffer = await response.arrayBuffer();

		// Upload to Vercel Blob
		const filename =
			fileInfo.file_name || `telegram_${Date.now()}.m4a`;
		const blobUrl = await storageService.uploadContent(
			`audio/${crypto.randomUUID()}-${filename}`,
			audioBuffer,
			"audio/m4a",
		);

		// Create DB record
		const transcriptionId = await transcriptionsService.create({
			audioKey: blobUrl,
			filename,
			source: "telegram",
			userMetadata: { chatId },
		});

		// notify-telegram step will send the result back
		await workflowService.startTranscription(transcriptionId);

		logger.info("Telegram file queued for transcription", {
			transcriptionId,
			chatId,
			filename,
		});
	} catch (error) {
		logger.error("Telegram file processing error", {
			chatId,
			error: getErrorMessage(error),
		});
		await ctx.reply(
			"Sorry, there was an error processing your file. Please try again.",
		);
	}
}
