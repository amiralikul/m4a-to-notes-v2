import OpenAI from "openai";

export interface OpenAiClientConfig {
	apiKey: string;
	baseURL?: string;
}

export function createOpenAiClient(config: OpenAiClientConfig): OpenAI {
	return new OpenAI({
		apiKey: config.apiKey,
		baseURL: config.baseURL,
	});
}
