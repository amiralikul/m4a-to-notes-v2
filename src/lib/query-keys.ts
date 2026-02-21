export const transcriptionKeys = {
	all: ["transcriptions"] as const,
	list: () => [...transcriptionKeys.all, "list"] as const,
	detail: (id: string) => [...transcriptionKeys.all, id] as const,
	summary: (id: string) =>
		[...transcriptionKeys.detail(id), "summary"] as const,
	translations: (id: string) =>
		[...transcriptionKeys.detail(id), "translations"] as const,
};
