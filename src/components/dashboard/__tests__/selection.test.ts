import { describe, expect, it } from "vitest";
import {
	createOptimisticDeleteSelectionTransition,
	getNextSelectedIdAfterDelete,
	resolveDashboardSelection,
} from "../selection";
import type { DashboardTranscriptionItem } from "../types";

function item(overrides: Partial<DashboardTranscriptionItem>): DashboardTranscriptionItem {
	return {
		id: "item-a",
		filename: "File A.m4a",
		createdAt: "2026-03-31T10:00:00.000Z",
		status: "completed",
		progress: 100,
		preview: "Transcript preview",
		summaryStatus: "completed",
		summaryUpdatedAt: "2026-03-31T10:05:00.000Z",
		audioKey: "https://example.com/audio-a.m4a",
		enableDiarization: false,
		translationCount: 0,
		...overrides,
	};
}

describe("resolveDashboardSelection", () => {
	it("keeps a valid deep-link selection without normalizing the URL", () => {
		const items = [
			item({ id: "item-a", filename: "File A.m4a" }),
			item({ id: "item-b", filename: "File B.m4a", createdAt: "2026-03-31T09:00:00.000Z" }),
		];

		const result = resolveDashboardSelection(items, "item-b");

		expect(result.selectedId).toBe("item-b");
		expect(result.normalizedId).toBe("item-b");
		expect(result.selectedItem?.id).toBe("item-b");
		expect(result.shouldReplaceUrl).toBe(false);
	});

	it("selects the first item and canonicalizes the URL when no item query param is present", () => {
		const items = [
			item({ id: "item-a", filename: "File A.m4a" }),
			item({ id: "item-b", filename: "File B.m4a", createdAt: "2026-03-31T09:00:00.000Z" }),
		];

		const result = resolveDashboardSelection(items, null);

		expect(result.selectedId).toBe("item-a");
		expect(result.normalizedId).toBe("item-a");
		expect(result.selectedItem?.id).toBe("item-a");
		expect(result.shouldReplaceUrl).toBe(true);
	});

	it("falls back to the first item and marks the URL for replacement when the requested item is invalid", () => {
		const items = [
			item({ id: "item-a", filename: "File A.m4a" }),
			item({ id: "item-b", filename: "File B.m4a", createdAt: "2026-03-31T09:00:00.000Z" }),
		];

		const result = resolveDashboardSelection(items, "missing-item");

		expect(result.selectedId).toBe("item-a");
		expect(result.normalizedId).toBe("item-a");
		expect(result.selectedItem?.id).toBe("item-a");
		expect(result.shouldReplaceUrl).toBe(true);
	});
});

describe("getNextSelectedIdAfterDelete", () => {
	it("returns null when deleting the final remaining transcription", () => {
		const items = [item({ id: "item-a", filename: "File A.m4a" })];

		const result = getNextSelectedIdAfterDelete(items, "item-a", "item-a");

		expect(result).toBeNull();
	});

	it("prefers the next surviving item after deleting the active selection", () => {
		const items = [
			item({ id: "item-a", filename: "File A.m4a" }),
			item({ id: "item-b", filename: "File B.m4a", createdAt: "2026-03-31T09:00:00.000Z" }),
			item({ id: "item-c", filename: "File C.m4a", createdAt: "2026-03-31T08:00:00.000Z" }),
		];

		const result = getNextSelectedIdAfterDelete(items, "item-a", "item-a");

		expect(result).toBe("item-b");
	});
});

describe("createOptimisticDeleteSelectionTransition", () => {
	it("reselects the next remaining item when the active selection is deleted", () => {
		const items = [
			item({ id: "item-a", filename: "File A.m4a" }),
			item({ id: "item-b", filename: "File B.m4a", createdAt: "2026-03-31T09:00:00.000Z" }),
			item({ id: "item-c", filename: "File C.m4a", createdAt: "2026-03-31T08:00:00.000Z" }),
		];

		const result = createOptimisticDeleteSelectionTransition(items, "item-a", "item-a");

		expect(result.next.items.map((item) => item.id)).toEqual(["item-b", "item-c"]);
		expect(result.next.selectedId).toBe("item-b");
		expect(result.next.normalizedId).toBe("item-b");
		expect(result.next.selectedItem?.id).toBe("item-b");
		expect(result.next.shouldReplaceUrl).toBe(true);
	});

	it("returns null when deleting the final remaining transcription", () => {
		const items = [item({ id: "item-a", filename: "File A.m4a" })];

		const result = createOptimisticDeleteSelectionTransition(items, "item-a", "item-a");

		expect(result.next.items).toEqual([]);
		expect(result.next.selectedId).toBeNull();
		expect(result.next.normalizedId).toBeNull();
		expect(result.next.selectedItem).toBeNull();
	});

	it("retains rollback data for restoring list state and URL selection together", () => {
		const items = [
			item({ id: "item-a", filename: "File A.m4a" }),
			item({ id: "item-b", filename: "File B.m4a", createdAt: "2026-03-31T09:00:00.000Z" }),
		];

		const result = createOptimisticDeleteSelectionTransition(items, "item-a", "item-a");

		expect(result.rollback).toEqual({
			items,
			selectedId: "item-a",
			normalizedId: "item-a",
			selectedItem: item({ id: "item-a", filename: "File A.m4a" }),
		});
	});
});
