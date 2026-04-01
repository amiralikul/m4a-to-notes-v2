import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import FileUpload from "../../file-upload";

vi.mock("@tanstack/react-query", () => ({
	useMutation: () => ({
		mutateAsync: vi.fn(),
	}),
	useQuery: () => ({
		data: [],
		isLoading: false,
		isFetching: false,
		error: null,
		refetch: vi.fn(),
	}),
	useQueryClient: () => ({
		cancelQueries: vi.fn(),
		getQueryData: vi.fn(),
		invalidateQueries: vi.fn(),
		removeQueries: vi.fn(),
		setQueryData: vi.fn(),
	}),
}));

vi.mock("@vercel/blob/client", () => ({
	upload: vi.fn(),
}));

vi.mock("@/env", () => ({
	env: {
		NEXT_PUBLIC_AUDIO_CHUNKER_URL: "",
	},
}));

vi.mock("@/hooks/use-auth", () => ({
	useAuth: () => ({
		isLoaded: true,
		isSignedIn: false,
	}),
}));

vi.mock("@/lib/logger", () => ({
	logger: {
		error: vi.fn(),
	},
}));

describe("FileUpload dashboardCompact variant", () => {
	it("renders the compact dashboard rail instead of the tall hero upload area", () => {
		const html = renderToStaticMarkup(
			<FileUpload showHistory={false} variant="dashboardCompact" />,
		);

		expect(html).toContain("Add a recording");
		expect(html).toContain("Upload files");
		expect(html).not.toContain("Upload Audio File");
		expect(html).not.toContain("Choose File");
	});
});
