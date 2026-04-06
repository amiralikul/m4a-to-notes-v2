import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import FileUpload from "@/components/file-upload";

const { useQueryMock, useMutationMock, useQueryClientMock } = vi.hoisted(() => ({
	useQueryMock: vi.fn(),
	useMutationMock: vi.fn(() => ({
		mutateAsync: vi.fn(),
		isPending: false,
		error: null,
		reset: vi.fn(),
	})),
	useQueryClientMock: vi.fn(() => ({
		invalidateQueries: vi.fn(),
		cancelQueries: vi.fn(),
		getQueryData: vi.fn(),
		setQueryData: vi.fn(),
	})),
}));

vi.mock("@tanstack/react-query", () => ({
	useQuery: useQueryMock,
	useMutation: useMutationMock,
	useQueryClient: useQueryClientMock,
}));

vi.mock("@/hooks/use-auth", () => ({
	useAuth: () => ({ isLoaded: true, isSignedIn: true }),
}));

vi.mock("@/env", () => ({
	env: { NEXT_PUBLIC_AUDIO_CHUNKER_URL: "" },
}));

vi.mock("@vercel/blob/client", () => ({
	upload: vi.fn(),
}));

vi.mock("@/lib/logger", () => ({
	logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

describe("FileUpload history titles", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		useQueryMock.mockReturnValue({
			data: [
				{
					id: "tr_1",
					filename: "meeting.m4a",
					displayName: "Team Sync",
					status: "completed",
					progress: 100,
					preview: "preview",
					audioKey: null,
					createdAt: "2026-03-20T00:00:00.000Z",
				},
			],
			isLoading: false,
			isFetching: false,
			error: null,
			refetch: vi.fn(),
		});
	});

	it("renders displayName on history cards and shows the rename affordance", () => {
		const html = renderToStaticMarkup(<FileUpload showHistory />);

		expect(html).toContain("Team Sync");
		expect(html).toContain("Rename Team Sync");
	});

	it("falls back to filename when displayName is null", () => {
		useQueryMock.mockReturnValue({
			data: [
				{
					id: "tr_2",
					filename: "fallback.m4a",
					displayName: null,
					status: "completed",
					progress: 100,
					preview: null,
					audioKey: null,
					createdAt: "2026-03-20T00:00:00.000Z",
				},
			],
			isLoading: false,
			isFetching: false,
			error: null,
			refetch: vi.fn(),
		});

		const html = renderToStaticMarkup(<FileUpload showHistory />);

		expect(html).toContain("fallback.m4a");
		expect(html).toContain("Rename fallback.m4a");
	});
});
