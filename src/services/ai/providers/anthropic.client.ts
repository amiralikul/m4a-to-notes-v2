import { createAnthropic } from "@ai-sdk/anthropic";

export interface AnthropicClientConfig {
	apiKey: string;
	baseURL?: string;
}

export function createAnthropicClient(config: AnthropicClientConfig) {
	return createAnthropic({
		apiKey: config.apiKey,
		baseURL: config.baseURL,
	});
}
