export function canSendStarterPrompt(input: {
	loadingHistory: boolean;
	isSubmitting: boolean;
}): boolean {
	return !input.loadingHistory && !input.isSubmitting;
}

export function shouldSubmitOnEnter(input: {
	key: string;
	shiftKey: boolean;
	isComposing: boolean;
}): boolean {
	return input.key === "Enter" && !input.shiftKey && !input.isComposing;
}
