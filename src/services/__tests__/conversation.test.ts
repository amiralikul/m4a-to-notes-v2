import { describe, it, expect, beforeEach } from "vitest";
import { createTestDb } from "@/test/db";
import { createTestLogger } from "@/test/setup";
import { ConversationService } from "../conversation";

describe("ConversationService", () => {
	let service: ConversationService;

	beforeEach(() => {
		const db = createTestDb();
		const logger = createTestLogger();
		service = new ConversationService(db, logger);
	});

	describe("getConversation", () => {
		it("returns new conversation for unknown chatId", async () => {
			const conversation = await service.getConversation("unknown_chat");
			expect(conversation.messages).toEqual([]);
			expect(conversation.createdAt).toBeDefined();
		});
	});

	describe("saveConversation + getConversation", () => {
		it("saves and retrieves conversation", async () => {
			const conversation = service.createNewConversation();
			conversation.messages.push({
				id: "1",
				type: "transcription",
				content: "Hello world",
				timestamp: new Date().toISOString(),
			});

			await service.saveConversation("chat_1", conversation);

			const retrieved = await service.getConversation("chat_1");
			expect(retrieved.messages).toHaveLength(1);
			expect(retrieved.messages[0].content).toBe("Hello world");
		});
	});

	describe("addTranscription", () => {
		it("adds transcription message to conversation", async () => {
			const message = await service.addTranscription(
				"chat_1",
				"This is a transcription",
				"file_123",
			);

			expect(message.type).toBe("transcription");
			expect(message.content).toBe("This is a transcription");
			expect(message.audioFileId).toBe("file_123");

			const conversation = await service.getConversation("chat_1");
			expect(conversation.messages).toHaveLength(1);
		});
	});

	describe("addUserMessage + addBotResponse", () => {
		it("builds a conversation thread", async () => {
			await service.addTranscription("chat_1", "Audio content", "file_1");
			await service.addUserMessage("chat_1", "What is this about?", "msg_1");
			await service.addBotResponse("chat_1", "This audio discusses...");

			const conversation = await service.getConversation("chat_1");
			expect(conversation.messages).toHaveLength(3);
			expect(conversation.messages[0].type).toBe("transcription");
			expect(conversation.messages[1].type).toBe("user_message");
			expect(conversation.messages[2].type).toBe("bot_response");
		});
	});

	describe("hasRecentTranscriptions", () => {
		it("returns false for empty conversation", () => {
			const conversation = service.createNewConversation();
			expect(service.hasRecentTranscriptions(conversation)).toBe(false);
		});

		it("returns true for recent transcription", () => {
			const conversation = service.createNewConversation();
			conversation.messages.push({
				id: "1",
				type: "transcription",
				content: "test",
				timestamp: new Date().toISOString(),
			});
			expect(service.hasRecentTranscriptions(conversation)).toBe(true);
		});

		it("returns false for old transcription", () => {
			const conversation = service.createNewConversation();
			const oldDate = new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago
			conversation.messages.push({
				id: "1",
				type: "transcription",
				content: "test",
				timestamp: oldDate.toISOString(),
			});
			expect(service.hasRecentTranscriptions(conversation)).toBe(false);
		});
	});

	describe("getContextForLLM", () => {
		it("returns empty array for empty conversation", () => {
			const conversation = service.createNewConversation();
			expect(service.getContextForLLM(conversation)).toEqual([]);
		});

		it("maps message types to roles correctly", () => {
			const conversation = service.createNewConversation();
			conversation.messages = [
				{
					id: "1",
					type: "transcription",
					content: "Audio text",
					timestamp: new Date().toISOString(),
				},
				{
					id: "2",
					type: "user_message",
					content: "Question?",
					timestamp: new Date().toISOString(),
				},
				{
					id: "3",
					type: "bot_response",
					content: "Answer.",
					timestamp: new Date().toISOString(),
				},
			];

			const context = service.getContextForLLM(conversation);
			expect(context).toHaveLength(3);
			expect(context[0].role).toBe("user");
			expect(context[0].content).toContain("[Audio Transcription]");
			expect(context[1].role).toBe("user");
			expect(context[2].role).toBe("assistant");
		});

		it("limits messages to maxMessages", () => {
			const conversation = service.createNewConversation();
			for (let i = 0; i < 20; i++) {
				conversation.messages.push({
					id: String(i),
					type: "user_message",
					content: `Message ${i}`,
					timestamp: new Date().toISOString(),
				});
			}

			const context = service.getContextForLLM(conversation, 5);
			expect(context).toHaveLength(5);
		});
	});

	describe("clearConversation", () => {
		it("removes conversation data", async () => {
			await service.addTranscription("chat_1", "Test", "file_1");

			await service.clearConversation("chat_1");

			const conversation = await service.getConversation("chat_1");
			expect(conversation.messages).toEqual([]);
		});
	});
});
