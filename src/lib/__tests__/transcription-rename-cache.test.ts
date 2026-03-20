import { describe, expect, it, vi } from "vitest";
import { invalidateTranscriptionRenameQueries } from "@/lib/transcription-rename-cache";
import { transcriptionKeys, viewerTranscriptionKeys } from "@/lib/query-keys";

describe("invalidateTranscriptionRenameQueries", () => {
	it("invalidates dashboard and viewer query families", async () => {
		const queryClient = {
			invalidateQueries: vi.fn().mockResolvedValue(undefined),
		};

		await invalidateTranscriptionRenameQueries(queryClient as never, "tr_1");

		expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
			queryKey: transcriptionKeys.list(),
		});
		expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
			queryKey: transcriptionKeys.detail("tr_1"),
		});
		expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
			queryKey: viewerTranscriptionKeys.lists(),
		});
	});
});
