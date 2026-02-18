import { describe, it, expect, vi, beforeEach } from "vitest";
import { StorageService } from "../storage";

// Mock @vercel/blob
vi.mock("@vercel/blob", () => ({
	put: vi.fn().mockResolvedValue({
		url: "https://blob.vercel-storage.com/test-abc123.m4a",
		pathname: "test.m4a",
	}),
	del: vi.fn().mockResolvedValue(undefined),
}));

describe("StorageService", () => {
	let service: StorageService;

	beforeEach(() => {
		vi.clearAllMocks();
		service = new StorageService();
	});

	describe("uploadContent", () => {
		it("uploads content and returns blob URL", async () => {
			const { put } = await import("@vercel/blob");

			const url = await service.uploadContent(
				"audio/test.m4a",
				new ArrayBuffer(100),
				"audio/m4a",
			);

			expect(url).toBe("https://blob.vercel-storage.com/test-abc123.m4a");
			expect(put).toHaveBeenCalledWith(
				"audio/test.m4a",
				expect.any(ArrayBuffer),
				{ access: "public", contentType: "audio/m4a" },
			);
		});
	});

	describe("downloadContent", () => {
		it("downloads content from blob URL", async () => {
			const mockBuffer = new ArrayBuffer(50);
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				arrayBuffer: () => Promise.resolve(mockBuffer),
			});

			const result = await service.downloadContent(
				"https://blob.vercel-storage.com/test.m4a",
			);

			expect(result).toBe(mockBuffer);
			expect(global.fetch).toHaveBeenCalledWith(
				"https://blob.vercel-storage.com/test.m4a",
			);
		});

		it("throws on failed download", async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: false,
				status: 404,
				statusText: "Not Found",
			});

			await expect(
				service.downloadContent("https://blob.vercel-storage.com/missing.m4a"),
			).rejects.toThrow("Failed to download blob");
		});
	});

	describe("deleteObject", () => {
		it("deletes object from blob storage", async () => {
			const { del } = await import("@vercel/blob");

			await service.deleteObject(
				"https://blob.vercel-storage.com/test.m4a",
			);

			expect(del).toHaveBeenCalledWith(
				"https://blob.vercel-storage.com/test.m4a",
				expect.objectContaining({ token: undefined }),
			);
		});
	});
});
