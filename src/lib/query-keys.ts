export const transcriptionKeys = {
	all: ["transcriptions"] as const,
	list: () => [...transcriptionKeys.all, "list"] as const,
	detail: (id: string) => [...transcriptionKeys.all, id] as const,
	chat: (id: string) => [...transcriptionKeys.detail(id), "chat"] as const,
	summary: (id: string) =>
		[...transcriptionKeys.detail(id), "summary"] as const,
	translations: (id: string) =>
		[...transcriptionKeys.detail(id), "translations"] as const,
};

export const viewerTranscriptionKeys = {
	all: ["viewer", "transcriptions"] as const,
	lists: () => [...viewerTranscriptionKeys.all, "list"] as const,
	list: (limit: number) =>
		[...viewerTranscriptionKeys.lists(), { limit }] as const,
};
