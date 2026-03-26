"use client";

import { useChat } from "@ai-sdk/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { DefaultChatTransport, type UIMessage } from "ai";
import {
	Loader2,
	MessageSquare,
	RefreshCw,
	SendHorizontal,
	Sparkles,
	Square,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { transcriptionKeys } from "@/lib/query-keys";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";

interface ChatResponse {
	id: string;
	messages: UIMessage[];
}

interface TranscriptionChatProps {
	transcriptionId: string;
}

const STARTER_PROMPTS = [
	"Summarize the key decisions from this transcript.",
	"Turn this transcript into a concise action-item list.",
	"What follow-up questions should I ask based on this conversation?",
];

async function fetchChat(transcriptionId: string): Promise<ChatResponse> {
	const response = await fetch(`/api/transcriptions/${transcriptionId}/chat`, {
		cache: "no-store",
	});

	if (!response.ok) {
		throw new Error("Failed to load chat history");
	}

	return response.json();
}

function getMessageText(message: UIMessage): string {
	return message.parts
		.filter(
			(part): part is Extract<(typeof message.parts)[number], { type: "text" }> =>
				part.type === "text" && typeof part.text === "string",
		)
		.map((part) => part.text)
		.join("")
		.trim();
}

function haveSameMessages(current: UIMessage[], next: UIMessage[]): boolean {
	if (current.length !== next.length) {
		return false;
	}

	return current.every((message, index) => {
		const candidate = next[index];

		return (
			candidate !== undefined &&
			message.id === candidate.id &&
			message.role === candidate.role &&
			getMessageText(message) === getMessageText(candidate)
		);
	});
}

export function TranscriptionChat({
	transcriptionId,
}: TranscriptionChatProps) {
	const queryClient = useQueryClient();
	const bottomRef = useRef<HTMLDivElement>(null);
	const [input, setInput] = useState("");

	const {
		data: chatHistory,
		error: historyError,
		isLoading: loadingHistory,
	} = useQuery({
		queryKey: transcriptionKeys.chat(transcriptionId),
		queryFn: () => fetchChat(transcriptionId),
	});

	const {
		clearError,
		error,
		messages,
		regenerate,
		sendMessage,
		setMessages,
		status,
		stop,
	} = useChat({
		id: `transcription-${transcriptionId}`,
		transport: new DefaultChatTransport({
			api: `/api/transcriptions/${transcriptionId}/chat`,
		}),
		onFinish: () => {
			void queryClient.invalidateQueries({
				queryKey: transcriptionKeys.chat(transcriptionId),
			});
		},
	});

	useEffect(() => {
		if (!chatHistory || status !== "ready") {
			return;
		}

		setMessages((currentMessages) =>
			haveSameMessages(currentMessages, chatHistory.messages)
				? currentMessages
				: chatHistory.messages,
		);
	}, [chatHistory, setMessages, status]);

	useEffect(() => {
		bottomRef.current?.scrollIntoView({
			behavior: status === "streaming" ? "auto" : "smooth",
		});
	}, [messages, status]);

	const isSubmitting = status === "submitted" || status === "streaming";
	const hasMessages = messages.length > 0;

	const handleSubmit = async () => {
		const value = input.trim();
		if (!value || isSubmitting) {
			return;
		}

		await sendMessage({ text: value });
		setInput("");
	};

	const handlePromptClick = async (prompt: string) => {
		if (isSubmitting) {
			return;
		}

		await sendMessage({ text: prompt });
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2 text-lg">
					<MessageSquare className="h-5 w-5" />
					Ask About This Transcript
				</CardTitle>
				<CardDescription>
					Ask follow-ups, pull out action items, or turn the transcript into
					something more useful.
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="flex flex-wrap gap-2">
					{STARTER_PROMPTS.map((prompt) => (
						<Button
							key={prompt}
							type="button"
							variant="outline"
							size="sm"
							onClick={() => void handlePromptClick(prompt)}
							disabled={isSubmitting}
							className="h-auto whitespace-normal py-2 text-left"
						>
							<Sparkles className="h-3.5 w-3.5" />
							<span>{prompt}</span>
						</Button>
					))}
				</div>

				<ScrollArea className="h-[420px] rounded-xl border border-stone-200 bg-stone-50/50">
					<div className="space-y-4 p-4">
						{loadingHistory ? (
							<div className="flex min-h-48 items-center justify-center text-sm text-stone-500">
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								Loading chat history...
							</div>
						) : !hasMessages ? (
							<div className="flex min-h-48 flex-col items-center justify-center gap-2 text-center text-sm text-stone-500">
								<MessageSquare className="h-5 w-5 text-stone-400" />
								<p>Start with a prompt above or ask your own question below.</p>
							</div>
						) : (
							messages.map((message) => {
								const text = getMessageText(message);
								const isUser = message.role === "user";

								return (
									<div
										key={message.id}
										className={cn(
											"flex",
											isUser ? "justify-end" : "justify-start",
										)}
									>
										<div
											className={cn(
												"max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-xs",
												isUser
													? "bg-stone-900 text-stone-50"
													: "border border-stone-200 bg-white text-stone-700",
											)}
										>
											<p className="mb-2 text-xs font-medium uppercase tracking-wide text-stone-400">
												{isUser ? "You" : "Assistant"}
											</p>
											{isUser ? (
												<p className="whitespace-pre-wrap leading-6">
													{text}
												</p>
											) : (
												<div className="prose prose-stone max-w-none text-sm leading-6">
													<ReactMarkdown remarkPlugins={[remarkGfm]}>
														{text || "_Thinking..._"}
													</ReactMarkdown>
												</div>
											)}
										</div>
									</div>
								);
							})
						)}

						{isSubmitting && (
							<div className="flex items-center gap-2 text-sm text-stone-500">
								<Loader2 className="h-4 w-4 animate-spin" />
								{status === "submitted"
									? "Sending your message..."
									: "Streaming response..."}
							</div>
						)}

						<div ref={bottomRef} />
					</div>
				</ScrollArea>

				{historyError && (
					<Alert variant="destructive">
						<AlertTitle>Chat history is unavailable</AlertTitle>
						<AlertDescription>
							{historyError instanceof Error
								? historyError.message
								: "Something went wrong while loading previous messages."}
						</AlertDescription>
					</Alert>
				)}

				{error && (
					<Alert variant="destructive">
						<AlertTitle>Chat request failed</AlertTitle>
						<AlertDescription className="gap-3">
							<p>{error.message || "Something went wrong while generating a reply."}</p>
							<div className="flex flex-wrap gap-2">
								<Button
									type="button"
									variant="outline"
									size="sm"
									onClick={() => {
										clearError();
										void regenerate();
									}}
								>
									<RefreshCw className="h-4 w-4" />
									Try again
								</Button>
								<Button
									type="button"
									variant="ghost"
									size="sm"
									onClick={clearError}
								>
									Dismiss
								</Button>
							</div>
						</AlertDescription>
					</Alert>
				)}

				<form
					className="space-y-3"
					onSubmit={(event) => {
						event.preventDefault();
						void handleSubmit();
					}}
				>
					<Textarea
						value={input}
						onChange={(event) => setInput(event.target.value)}
						placeholder="Ask about decisions, risks, next steps, or ask for a formatted recap..."
						className="min-h-28 resize-y bg-white"
						disabled={loadingHistory}
						onKeyDown={(event) => {
							if (event.key === "Enter" && !event.shiftKey) {
								event.preventDefault();
								void handleSubmit();
							}
						}}
					/>
					<div className="flex items-center justify-between gap-3">
						<p className="text-xs text-stone-500">
							Press Enter to send. Use Shift+Enter for a new line.
						</p>
						<div className="flex items-center gap-2">
							{isSubmitting && (
								<Button
									type="button"
									variant="outline"
									onClick={() => void stop()}
								>
									<Square className="h-3.5 w-3.5 fill-current" />
									Stop
								</Button>
							)}
							<Button
								type="submit"
								disabled={!input.trim() || loadingHistory || isSubmitting}
							>
								{isSubmitting ? (
									<Loader2 className="h-4 w-4 animate-spin" />
								) : (
									<SendHorizontal className="h-4 w-4" />
								)}
								Send
							</Button>
						</div>
					</div>
				</form>
			</CardContent>
		</Card>
	);
}
