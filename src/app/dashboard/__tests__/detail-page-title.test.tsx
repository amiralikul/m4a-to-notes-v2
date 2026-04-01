import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import TranscriptionDetailPage from "@/app/dashboard/[id]/page";

const { useQueryMock, useMutationMock, useQueryClientMock } = vi.hoisted(() => ({
	useQueryMock: vi.fn(),
	useMutationMock: vi.fn(() => ({
		mutate: vi.fn(),
		mutateAsync: vi.fn(),
		isPending: false,
		isError: false,
		error: null,
		reset: vi.fn(),
	})),
	useQueryClientMock: vi.fn(() => ({
		invalidateQueries: vi.fn(),
	})),
}));

vi.mock("@tanstack/react-query", () => ({
	useQuery: useQueryMock,
	useMutation: useMutationMock,
	useQueryClient: useQueryClientMock,
}));

vi.mock("next/navigation", () => ({
	useParams: () => ({ id: "tr_1" }),
	useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/hooks/use-auth", () => ({
	useAuth: () => ({ isLoaded: true, isSignedIn: true }),
}));

describe("Dashboard detail title", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		useQueryMock.mockImplementation(({ queryKey }: { queryKey: unknown[] }) => {
			if (queryKey[0] === "transcriptions" && queryKey[1] === "tr_1") {
				return {
					data: {
						transcriptionId: "tr_1",
						filename: "meeting.m4a",
						displayName: "Team Sync",
						status: "completed",
						progress: 100,
						createdAt: "2026-03-20T00:00:00.000Z",
						completedAt: "2026-03-20T00:05:00.000Z",
						preview: "preview",
						enableDiarization: false,
						diarizationData: null,
						transcriptText: "preview",
						summaryStatus: null,
						summaryUpdatedAt: null,
					},
					isLoading: false,
				};
			}

			return { data: undefined, isLoading: false };
		});
	});

	it("renders displayName in the detail header and shows the rename affordance", () => {
		const html = renderToStaticMarkup(<TranscriptionDetailPage />);

		expect(html).toContain("Team Sync");
		expect(html).toContain("Rename Team Sync");
	});

	it("falls back to filename in the detail header when displayName is null", () => {
		useQueryMock.mockImplementation(({ queryKey }: { queryKey: unknown[] }) => {
			if (queryKey[0] === "transcriptions" && queryKey[1] === "tr_1") {
				return {
					data: {
						transcriptionId: "tr_1",
						filename: "fallback.m4a",
						displayName: null,
						status: "completed",
						progress: 100,
						createdAt: "2026-03-20T00:00:00.000Z",
						completedAt: "2026-03-20T00:05:00.000Z",
						preview: "preview",
						enableDiarization: false,
						diarizationData: null,
						transcriptText: "preview",
						summaryStatus: null,
						summaryUpdatedAt: null,
					},
					isLoading: false,
				};
			}

			return { data: undefined, isLoading: false };
		});

		const html = renderToStaticMarkup(<TranscriptionDetailPage />);

		expect(html).toContain("fallback.m4a");
		expect(html).toContain("Rename fallback.m4a");
	});
});
