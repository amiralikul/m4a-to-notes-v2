import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { useState } from "react";
import FileUpload from "../../file-upload";

const reactState = vi.hoisted(() => ({
	useState: vi.fn(),
}));

vi.mock("react", async () => {
	const actual = await vi.importActual<typeof import("react")>("react");
	return {
		...actual,
		useState: reactState.useState,
	};
});

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

function mockFileUploadState(uploadedFiles: Array<{
	id: string;
	file: File;
	status: "uploading" | "processing" | "completed" | "error";
	progress: number;
	error?: string;
	transcription?: string;
	transcriptionId?: string;
	audioUrl?: string;
}>) {
	const mockedUseState = vi.mocked(useState);

	mockedUseState.mockReset();
	mockedUseState
		.mockImplementationOnce(() => [false, vi.fn()])
		.mockImplementationOnce(() => [uploadedFiles, vi.fn()])
		.mockImplementationOnce(() => [new Set<string>(), vi.fn()])
		.mockImplementationOnce(() => [null, vi.fn()])
		.mockImplementationOnce(() => [[], vi.fn()])
		.mockImplementationOnce(() => [false, vi.fn()])
		.mockImplementationOnce(() => [false, vi.fn()]);
}

describe("FileUpload dashboardCompact variant", () => {
	it("renders the compact dashboard rail instead of the tall hero upload area", () => {
		mockFileUploadState([]);

		const html = renderToStaticMarkup(
			<FileUpload showHistory={false} variant="dashboardCompact" />,
		);

		expect(html).toContain("Add a recording");
		expect(html).toContain("Upload files");
		expect(html).not.toContain("Upload Audio File");
		expect(html).not.toContain("Choose File");
	});

	it("renders dashboard upload progress items without throwing when uploads exist", () => {
		mockFileUploadState([
			{
				id: "upload-1",
				file: new File(["audio"], "team-sync.m4a", { type: "audio/mp4" }),
				status: "uploading",
				progress: 42,
			},
		]);

		expect(() =>
			renderToStaticMarkup(
				<FileUpload showHistory={false} variant="dashboardCompact" />,
			),
		).not.toThrow();
	});
});
