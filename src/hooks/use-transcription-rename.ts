"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { invalidateTranscriptionRenameQueries } from "@/lib/transcription-rename-cache";

export async function renameTranscriptionApi(
	transcriptionId: string,
	displayName: string,
) {
	const trimmedDisplayName = displayName.trim();
	const response = await fetch(`/api/me/transcriptions/${transcriptionId}`, {
		method: "PATCH",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ displayName: trimmedDisplayName }),
	});

	if (!response.ok) {
		const data = (await response.json().catch(() => ({}))) as {
			error?: string;
		};
		throw new Error(data.error || "Could not rename transcription right now.");
	}

	return response.json();
}

export function useTranscriptionRename(transcriptionId: string) {
	const queryClient = useQueryClient();

	const mutation = useMutation({
		mutationFn: (displayName: string) =>
			renameTranscriptionApi(transcriptionId, displayName),
		onSuccess: async () => {
			await invalidateTranscriptionRenameQueries(queryClient, transcriptionId);
		},
	});

	return {
		rename: mutation.mutateAsync,
		isPending: mutation.isPending,
		errorMessage: mutation.error?.message ?? null,
		clearError: mutation.reset,
	};
}
