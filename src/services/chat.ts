import OpenAI, { APIError } from "openai";
import { getErrorMessage } from "@/lib/errors";
import type { Logger } from "@/lib/logger";

export async function getChatCompletion(
	messages: Array<{ role: string; content: string }>,
	apiKey: string,
	logger: Logger,
) {
	logger.debug("Requesting chat completion from OpenAI", {
		messageCount: messages.length,
	});

	const openai = new OpenAI({ apiKey });

	try {
		const completion = await openai.chat.completions.create({
			model: "gpt-4o",
			messages: [
				{
					role: "system",
					content:
						"You are a helpful assistant that can answer questions about audio transcriptions. Be concise and helpful in your responses.",
				},
				...(messages as OpenAI.ChatCompletionMessageParam[]),
			],
			max_tokens: 1000,
			temperature: 0.7,
		});

		const responseContent = completion.choices[0]?.message?.content || "";

		logger.info("Chat completion received", {
			completionLength: responseContent.length,
			tokensUsed: completion.usage?.total_tokens || 0,
		});

		return responseContent;
	} catch (error) {
		logger.error("OpenAI chat completion failed", {
			error: getErrorMessage(error),
			status: error instanceof APIError ? error.status : undefined,
		});
		throw new Error(`OpenAI API error: ${getErrorMessage(error)}`);
	}
}
