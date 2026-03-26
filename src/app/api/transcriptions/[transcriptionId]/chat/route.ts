import { type UIMessage } from "ai";
import { z } from "zod";
import { getErrorMessage, NotFoundError, ValidationError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { route } from "@/lib/route";
import {
	transcriptionChatAiService,
	transcriptionChatRetrievalService,
	transcriptionChatsService,
	transcriptionsService,
} from "@/services";
import { TranscriptionStatus } from "@/services/transcriptions";

const chatParamsSchema = z.object({
	transcriptionId: z.string(),
});

const chatMessagePartSchema = z
	.object({
		type: z.string(),
		text: z.string().optional(),
	})
	.passthrough();

const chatMessageSchema = z
	.object({
		id: z.string(),
		role: z.enum(["system", "user", "assistant"]),
		parts: z.array(chatMessagePartSchema),
	})
	.passthrough();

const chatRequestSchema = z.object({
	id: z.string(),
	messages: z.array(chatMessageSchema),
	trigger: z.enum(["submit-message", "regenerate-message"]),
	messageId: z.string().optional(),
});

export const GET = route({
	auth: "required",
	params: chatParamsSchema,
	handler: async ({ userId, params }) => {
		await requireCompletedTranscription(params.transcriptionId, userId);

		const chat = await transcriptionChatsService.getOrCreateForTranscriptionAndUser(
			params.transcriptionId,
			userId,
		);
		const messages = await transcriptionChatsService.listMessages(chat.id);

		return {
			id: chat.id,
			messages: messages.map((message) => ({
				id: message.id,
				role: message.role,
				parts: message.parts,
			})),
		};
	},
});

export const POST = route({
	auth: "required",
	params: chatParamsSchema,
	body: chatRequestSchema,
	handler: async ({ request, userId, params, body }) => {
		await requireCompletedTranscription(params.transcriptionId, userId);

		const chat = await transcriptionChatsService.getOrCreateForTranscriptionAndUser(
			params.transcriptionId,
			userId,
		);

		const latestUserText = extractLatestUserText(body.messages as UIMessage[]);
		if (!latestUserText) {
			throw new ValidationError(
				"Message payload must include a user text message",
			);
		}

		const isRegeneration = body.trigger === "regenerate-message";

		if (!isRegeneration) {
			await transcriptionChatsService.appendUserMessage(chat.id, [
				{ type: "text", text: latestUserText },
			]);
		}

		const retrievedChunks =
			await transcriptionChatRetrievalService.findRelevantChunks(
				params.transcriptionId,
				latestUserText,
			);

		const result = await transcriptionChatAiService.streamResponse({
			messages: body.messages as UIMessage[],
			latestUserText,
			retrievedChunks,
			abortSignal: request.signal,
			requestId: body.id,
			idempotencyKey: body.messageId ?? body.id,
		});

		return result.toUIMessageStreamResponse({
			originalMessages: body.messages as UIMessage[],
			generateMessageId: () => crypto.randomUUID(),
			onFinish: async ({ isAborted, responseMessage }) => {
				if (isAborted) return;

				const assistantParts = responseMessage.parts
					.filter((part) => typeof part.type === "string")
					.map((part) => ({ ...part }));

				if (assistantParts.length === 0) {
					return;
				}

				try {
					if (isRegeneration) {
						await transcriptionChatsService.replaceLatestAssistantMessage(
							chat.id,
							assistantParts,
							retrievedChunks.map((chunk) => ({
								chunkId: chunk.id,
								startMs: chunk.startMs,
								endMs: chunk.endMs,
								text: chunk.text,
							})),
						);
					} else {
						await transcriptionChatsService.appendAssistantMessage(
							chat.id,
							assistantParts,
							retrievedChunks.map((chunk) => ({
								chunkId: chunk.id,
								startMs: chunk.startMs,
								endMs: chunk.endMs,
								text: chunk.text,
							})),
						);
					}
				} catch (error) {
					logger.error("Failed to persist assistant chat message", {
						transcriptionId: params.transcriptionId,
						chatId: chat.id,
						userId,
						requestId: body.id,
						responseMessageId: responseMessage.id,
						error: getErrorMessage(error),
					});
				}
			},
		});
	},
});

async function requireCompletedTranscription(
	transcriptionId: string,
	userId: string,
) {
	const transcription = await transcriptionsService.findByIdForOwner(
		transcriptionId,
		{ userId, actorId: null },
	);

	if (!transcription) {
		throw new NotFoundError("Transcription not found");
	}

	if (transcription.status !== TranscriptionStatus.COMPLETED) {
		throw new ValidationError(
			"Cannot chat until transcription is completed",
		);
	}

	return transcription;
}

function extractLatestUserText(messages: UIMessage[]): string | null {
	for (let index = messages.length - 1; index >= 0; index -= 1) {
		const message = messages[index];
		if (message.role !== "user") {
			continue;
		}

		const text = message.parts
			.filter(
				(part): part is Extract<(typeof message.parts)[number], { type: "text" }> =>
					part.type === "text" &&
					typeof part.text === "string" &&
					part.text.trim().length > 0,
			)
			.map((part) => part.text.trim())
			.join(" ")
			.trim();

		if (text) {
			return text;
		}
	}

	return null;
}
