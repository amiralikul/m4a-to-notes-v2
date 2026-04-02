import type { QueryClient } from "@tanstack/react-query";
import { transcriptionKeys, viewerTranscriptionKeys } from "@/lib/query-keys";

export async function invalidateTranscriptionRenameQueries(
	queryClient: QueryClient,
	transcriptionId: string,
) {
	await Promise.all([
		queryClient.invalidateQueries({ queryKey: transcriptionKeys.list() }),
		queryClient.invalidateQueries({
			queryKey: transcriptionKeys.detail(transcriptionId),
		}),
		queryClient.invalidateQueries({
			queryKey: viewerTranscriptionKeys.lists(),
		}),
	]);
}
