import { beforeEach, describe, expect, it, vi } from "vitest";
import { getServerSession } from "@/lib/auth-server";
import {
	transcriptionChatAiService,
	transcriptionChatRetrievalService,
	transcriptionChatsService,
	transcriptionsService,
} from "@/services";

const mocks = vi.hoisted(() => ({
	getServerSession: vi.fn(),
	findByIdForOwner: vi.fn(),
	getOrCreateForTranscriptionAndUser: vi.fn(),
	listMessages: vi.fn(),
	appendUserMessage: vi.fn(),
	appendAssistantMessage: vi.fn(),
	replaceLatestAssistantMessage: vi.fn(),
	clearMessages: vi.fn(),
	findRelevantChunks: vi.fn(),
	streamResponse: vi.fn(),
	toUIMessageStreamResponse: vi.fn(),
	logger: {
		info: vi.fn(),
		warn: vi.fn(),
		error: vi.fn(),
		debug: vi.fn(),
	},
}));

vi.mock("@/lib/auth-server", () => ({
	getServerSession: mocks.getServerSession,
}));

vi.mock("@/services", () => ({
	transcriptionsService: {
		findByIdForOwner: mocks.findByIdForOwner,
	},
	transcriptionChatsService: {
		getOrCreateForTranscriptionAndUser: mocks.getOrCreateForTranscriptionAndUser,
		listMessages: mocks.listMessages,
		appendUserMessage: mocks.appendUserMessage,
		appendAssistantMessage: mocks.appendAssistantMessage,
		replaceLatestAssistantMessage: mocks.replaceLatestAssistantMessage,
		clearMessages: mocks.clearMessages,
	},
	transcriptionChatRetrievalService: {
		findRelevantChunks: mocks.findRelevantChunks,
	},
	transcriptionChatAiService: {
		streamResponse: mocks.streamResponse,
	},
}));

vi.mock("@/lib/logger", () => ({
	logger: mocks.logger,
}));

function createChatPayload(latestUserText = "What did they decide about the budget?") {
	return {
		id: "req_123",
		messageId: "msg_user_latest",
		trigger: "submit-message" as const,
		messages: [
			{
				id: "msg_assistant_1",
				role: "assistant" as const,
				parts: [{ type: "text", text: "Earlier answer." }],
			},
			{
				id: "msg_user_latest",
				role: "user" as const,
				parts: [
					{ type: "text", text: latestUserText },
					{ type: "text", text: " Include timestamps." },
				],
			},
		],
	};
}

async function loadRouteModule() {
	return import("@/app/api/transcriptions/[transcriptionId]/chat/route");
}

describe("transcription chat route", () => {
	let finishPromise: Promise<unknown> | null;
	let streamFinishEvent: {
		isAborted: boolean;
		responseMessage: {
			id: string;
			role: "assistant";
			parts: Array<{ type: string; text?: string; state?: string }>;
		};
	} | null;

	beforeEach(() => {
		vi.clearAllMocks();
		finishPromise = null;
		streamFinishEvent = {
			isAborted: false,
			responseMessage: {
				id: "msg_streamed_assistant_1",
				role: "assistant",
				parts: [{ type: "text", text: "The budget was approved at 01:01-01:15." }],
			},
		};

		mocks.getServerSession.mockResolvedValue({
			user: { id: "user_123", email: "user@example.com", name: "User" },
			session: { id: "session_123", userId: "user_123" },
		});
		mocks.findByIdForOwner.mockResolvedValue({
			id: "tr_123",
			userId: "user_123",
			status: "completed",
			transcriptText: "Budget approved.",
			filename: "meeting.m4a",
		});
		mocks.getOrCreateForTranscriptionAndUser.mockResolvedValue({
			id: "chat_123",
			transcriptionId: "tr_123",
			userId: "user_123",
		});
		mocks.listMessages.mockResolvedValue([
			{
				id: "msg_existing_1",
				role: "assistant",
				parts: [{ type: "text", text: "Existing answer." }],
				quotedChunks: null,
				createdAt: "2026-03-26T10:00:00.000Z",
			},
		]);
		mocks.appendUserMessage.mockResolvedValue({
			id: "msg_saved_user_1",
			role: "user",
		});
		mocks.appendAssistantMessage.mockResolvedValue({
			id: "msg_saved_assistant_1",
			role: "assistant",
		});
		mocks.replaceLatestAssistantMessage.mockResolvedValue({
			id: "msg_existing_1",
			role: "assistant",
		});
		mocks.clearMessages.mockResolvedValue(undefined);
		mocks.findRelevantChunks.mockResolvedValue([
			{
				id: "chunk_1",
				text: "Budget approved at the end of the meeting.",
				startMs: 61_000,
				endMs: 75_000,
				chunkIndex: 3,
				score: 4,
			},
		]);
		mocks.toUIMessageStreamResponse.mockImplementation((options?: {
			onFinish?: (event: typeof streamFinishEvent extends null ? never : NonNullable<typeof streamFinishEvent>) => Promise<unknown> | unknown;
		}) => {
			finishPromise = streamFinishEvent && options?.onFinish
				? Promise.resolve(options.onFinish(streamFinishEvent))
				: Promise.resolve();
			return new Response("stream", { status: 200 });
		});
		mocks.streamResponse.mockResolvedValue({
			toUIMessageStreamResponse: mocks.toUIMessageStreamResponse,
		});
	});

	it("returns 401 when signed out", async () => {
		mocks.getServerSession.mockResolvedValue(null);
		const { GET } = await loadRouteModule();

		const response = await GET(
			new Request("http://localhost:3000/api/transcriptions/tr_123/chat"),
			{ params: Promise.resolve({ transcriptionId: "tr_123" }) },
		);
		const body = await response.json();

		expect(response.status).toBe(401);
		expect(body.error).toBe("Unauthorized");
		expect(transcriptionsService.findByIdForOwner).not.toHaveBeenCalled();
	});

	it("loads or creates the chat on GET", async () => {
		const { GET } = await loadRouteModule();

		const response = await GET(
			new Request("http://localhost:3000/api/transcriptions/tr_123/chat"),
			{ params: Promise.resolve({ transcriptionId: "tr_123" }) },
		);
		const body = await response.json();

		expect(response.status).toBe(200);
		expect(transcriptionsService.findByIdForOwner).toHaveBeenCalledWith(
			"tr_123",
			{ userId: "user_123", actorId: null },
		);
		expect(transcriptionChatsService.getOrCreateForTranscriptionAndUser).toHaveBeenCalledWith(
			"tr_123",
			"user_123",
		);
		expect(transcriptionChatsService.listMessages).toHaveBeenCalledWith("chat_123");
		expect(body).toEqual({
			id: "chat_123",
			messages: [
				{
					id: "msg_existing_1",
					role: "assistant",
					parts: [{ type: "text", text: "Existing answer." }],
				},
			],
		});
	});

	it("rejects POST when the transcription is not completed", async () => {
		mocks.findByIdForOwner.mockResolvedValue({
			id: "tr_123",
			userId: "user_123",
			status: "processing",
			transcriptText: null,
			filename: "meeting.m4a",
		});
		const { POST } = await loadRouteModule();

		const response = await POST(
			new Request("http://localhost:3000/api/transcriptions/tr_123/chat", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(createChatPayload()),
			}),
			{ params: Promise.resolve({ transcriptionId: "tr_123" }) },
		);
		const body = await response.json();

		expect(response.status).toBe(400);
		expect(body.error).toBe(
			"Cannot chat until transcription is completed",
		);
		expect(transcriptionChatsService.appendUserMessage).not.toHaveBeenCalled();
		expect(transcriptionChatAiService.streamResponse).not.toHaveBeenCalled();
	});

	it("persists the user message before starting the chat stream", async () => {
		const { POST } = await loadRouteModule();

		const response = await POST(
			new Request("http://localhost:3000/api/transcriptions/tr_123/chat", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(createChatPayload()),
			}),
			{ params: Promise.resolve({ transcriptionId: "tr_123" }) },
		);
		await finishPromise;

		expect(response.status).toBe(200);
		expect(transcriptionChatsService.appendUserMessage).toHaveBeenCalledWith(
			"chat_123",
			[
				{
					type: "text",
					text: "What did they decide about the budget? Include timestamps.",
				},
			],
		);
		expect(
			vi.mocked(transcriptionChatsService.appendUserMessage).mock.invocationCallOrder[0],
		).toBeLessThan(
			vi.mocked(transcriptionChatAiService.streamResponse).mock.invocationCallOrder[0],
		);
		expect(transcriptionChatRetrievalService.findRelevantChunks).toHaveBeenCalledWith(
			"tr_123",
			"What did they decide about the budget? Include timestamps.",
		);
		expect(transcriptionChatsService.appendAssistantMessage).toHaveBeenCalledWith(
			"chat_123",
			[{ type: "text", text: "The budget was approved at 01:01-01:15." }],
			[
				{
					chunkId: "chunk_1",
					startMs: 61_000,
					endMs: 75_000,
					text: "Budget approved at the end of the meeting.",
				},
			],
		);
	});

	it("does not persist an assistant message when the stream is aborted", async () => {
		streamFinishEvent = {
			isAborted: true,
			responseMessage: {
				id: "msg_streamed_assistant_1",
				role: "assistant",
				parts: [{ type: "text", text: "This should not be saved." }],
			},
		};
		const { POST } = await loadRouteModule();

		const response = await POST(
			new Request("http://localhost:3000/api/transcriptions/tr_123/chat", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(createChatPayload()),
			}),
			{ params: Promise.resolve({ transcriptionId: "tr_123" }) },
		);
		await finishPromise;

		expect(response.status).toBe(200);
		expect(transcriptionChatsService.appendAssistantMessage).not.toHaveBeenCalled();
		expect(transcriptionChatsService.replaceLatestAssistantMessage).not.toHaveBeenCalled();
	});

	it("regenerates without persisting a duplicate user message", async () => {
		const { POST } = await loadRouteModule();

		const response = await POST(
			new Request("http://localhost:3000/api/transcriptions/tr_123/chat", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					...createChatPayload(),
					trigger: "regenerate-message",
				}),
			}),
			{ params: Promise.resolve({ transcriptionId: "tr_123" }) },
		);
		await finishPromise;

		expect(response.status).toBe(200);
		expect(transcriptionChatsService.appendUserMessage).not.toHaveBeenCalled();
		expect(transcriptionChatsService.replaceLatestAssistantMessage).toHaveBeenCalledWith(
			"chat_123",
			[{ type: "text", text: "The budget was approved at 01:01-01:15." }],
			[
				{
					chunkId: "chunk_1",
					startMs: 61_000,
					endMs: 75_000,
					text: "Budget approved at the end of the meeting.",
				},
			],
		);
		expect(transcriptionChatsService.appendAssistantMessage).not.toHaveBeenCalled();
	});

	it("logs regenerate replacement failures without losing history in the route", async () => {
		mocks.replaceLatestAssistantMessage.mockRejectedValueOnce(
			new Error("replacement failed"),
		);
		const { POST } = await loadRouteModule();

		const response = await POST(
			new Request("http://localhost:3000/api/transcriptions/tr_123/chat", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					...createChatPayload(),
					trigger: "regenerate-message",
				}),
			}),
			{ params: Promise.resolve({ transcriptionId: "tr_123" }) },
		);
		await finishPromise;

		expect(response.status).toBe(200);
		expect(transcriptionChatsService.replaceLatestAssistantMessage).toHaveBeenCalledOnce();
		expect(transcriptionChatsService.appendAssistantMessage).not.toHaveBeenCalled();
		expect(mocks.logger.error).toHaveBeenCalledWith(
			"Failed to persist assistant chat message",
			expect.objectContaining({
				transcriptionId: "tr_123",
				chatId: "chat_123",
				userId: "user_123",
				requestId: "req_123",
				responseMessageId: "msg_streamed_assistant_1",
				error: "replacement failed",
			}),
		);
	});

	it("returns 400 for an empty message payload", async () => {
		const { POST } = await loadRouteModule();

		const response = await POST(
			new Request("http://localhost:3000/api/transcriptions/tr_123/chat", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					id: "req_123",
					messageId: "msg_user_latest",
					trigger: "submit-message",
					messages: [],
				}),
			}),
			{ params: Promise.resolve({ transcriptionId: "tr_123" }) },
		);
		const body = await response.json();

		expect(response.status).toBe(400);
		expect(body.error).toBe("Message payload must include a user text message");
		expect(transcriptionChatsService.appendUserMessage).not.toHaveBeenCalled();
		expect(transcriptionChatAiService.streamResponse).not.toHaveBeenCalled();
	});

	it("clears persisted messages on DELETE", async () => {
		const { DELETE } = await loadRouteModule();

		const response = await DELETE(
			new Request("http://localhost:3000/api/transcriptions/tr_123/chat", {
				method: "DELETE",
			}),
			{ params: Promise.resolve({ transcriptionId: "tr_123" }) },
		);
		const body = await response.json();

		expect(response.status).toBe(200);
		expect(transcriptionChatsService.getOrCreateForTranscriptionAndUser).toHaveBeenCalledWith(
			"tr_123",
			"user_123",
		);
		expect(transcriptionChatsService.clearMessages).toHaveBeenCalledWith("chat_123");
		expect(body).toEqual({ success: true });
		expect(transcriptionChatAiService.streamResponse).not.toHaveBeenCalled();
	});
});
