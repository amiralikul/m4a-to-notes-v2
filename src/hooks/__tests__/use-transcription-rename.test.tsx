import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useTranscriptionRename } from "@/hooks/use-transcription-rename";
import { transcriptionKeys, viewerTranscriptionKeys } from "@/lib/query-keys";

const { mutationState, useMutationMock, useQueryClientMock } = vi.hoisted(() => {
	const mutationState = {
		mutationFn: null as null | ((displayName: string) => Promise<unknown>),
		onSuccess: null as null | (() => Promise<void> | void),
	};

	return {
		mutationState,
		useMutationMock: vi.fn(
			(options: {
				mutationFn: (displayName: string) => Promise<unknown>;
				onSuccess: () => Promise<void> | void;
			}) => {
				mutationState.mutationFn = options.mutationFn;
				mutationState.onSuccess = options.onSuccess;
				return {
					mutateAsync: vi.fn(),
					isPending: false,
					error: null,
					reset: vi.fn(),
				};
			},
		),
		useQueryClientMock: vi.fn(() => ({ marker: "query-client" })),
	};
});

vi.mock("@tanstack/react-query", () => ({
	useMutation: useMutationMock,
	useQueryClient: useQueryClientMock,
}));

function HookProbe() {
	useTranscriptionRename("tr_1");
	return <div>probe</div>;
}

describe("useTranscriptionRename", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mutationState.mutationFn = null;
		mutationState.onSuccess = null;
		useQueryClientMock.mockReturnValue({
			invalidateQueries: vi.fn().mockResolvedValue(undefined),
		});
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue({
				ok: true,
				json: vi.fn().mockResolvedValue({ id: "tr_1", displayName: "Team Sync" }),
			}),
		);
	});

	it("sends the trimmed displayName and invalidates both query families after success", async () => {
		renderToStaticMarkup(<HookProbe />);
		const queryClient = useQueryClientMock.mock.results[0]?.value;

		expect(mutationState.mutationFn).not.toBeNull();
		expect(mutationState.onSuccess).not.toBeNull();

		await mutationState.mutationFn?.(" Team Sync ");

		expect(fetch).toHaveBeenCalledWith("/api/me/transcriptions/tr_1", {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ displayName: "Team Sync" }),
		});

		await mutationState.onSuccess?.();

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
