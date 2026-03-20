import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import DashboardPage from "@/app/dashboard/page";

const { useQueryMock, useMutationMock, useQueryClientMock } = vi.hoisted(() => ({
	useQueryMock: vi.fn(),
	useMutationMock: vi.fn(() => ({
		mutate: vi.fn(),
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
		removeQueries: vi.fn(),
	})),
}));

vi.mock("@tanstack/react-query", () => ({
	useQuery: useQueryMock,
	useMutation: useMutationMock,
	useQueryClient: useQueryClientMock,
}));

vi.mock("@/hooks/use-auth", () => ({
	useAuth: () => ({ isLoaded: true }),
}));

vi.mock("@/components/file-upload", () => ({
	default: () => <div>file-upload</div>,
}));

describe("Dashboard list titles", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		useQueryMock.mockReturnValue({
			data: {
				transcriptions: [
					{
						id: "tr_1",
						filename: "meeting.m4a",
						displayName: "Team Sync",
						status: "completed",
						progress: 100,
						preview: null,
						summaryStatus: null,
						summaryUpdatedAt: null,
						createdAt: "2026-03-20T00:00:00.000Z",
						completedAt: "2026-03-20T00:05:00.000Z",
						audioKey: "",
						enableDiarization: false,
						translationCount: 0,
					},
				],
				total: 1,
			},
			isLoading: false,
			error: null,
		});
	});

	it("renders displayName on dashboard rows and shows the rename affordance", () => {
		const html = renderToStaticMarkup(<DashboardPage />);

		expect(html).toContain("Team Sync");
		expect(html).toContain("Rename Team Sync");
	});

	it("falls back to filename on dashboard rows when displayName is null", () => {
		useQueryMock.mockReturnValue({
			data: {
				transcriptions: [
					{
						id: "tr_2",
						filename: "fallback.m4a",
						displayName: null,
						status: "completed",
						progress: 100,
						preview: null,
						summaryStatus: null,
						summaryUpdatedAt: null,
						createdAt: "2026-03-20T00:00:00.000Z",
						completedAt: "2026-03-20T00:05:00.000Z",
						audioKey: "",
						enableDiarization: false,
						translationCount: 0,
					},
				],
				total: 1,
			},
			isLoading: false,
			error: null,
		});

		const html = renderToStaticMarkup(<DashboardPage />);

		expect(html).toContain("fallback.m4a");
		expect(html).toContain("Rename fallback.m4a");
	});
});
