import type {
	DashboardDeleteSelectionTransition,
	DashboardSelectionState,
	DashboardTranscriptionItem,
} from "./types";

export function resolveDashboardSelection<
	TItem extends DashboardTranscriptionItem,
>(
	items: readonly TItem[],
	requestedId: string | null | undefined,
): DashboardSelectionState<TItem> {
	if (items.length === 0) {
		return {
			selectedId: null,
			normalizedId: null,
			selectedItem: null,
			shouldReplaceUrl: Boolean(requestedId),
		};
	}

	if (requestedId) {
		const selectedItem = items.find((item) => item.id === requestedId);
		if (selectedItem) {
			return {
				selectedId: selectedItem.id,
				normalizedId: selectedItem.id,
				selectedItem,
				shouldReplaceUrl: false,
			};
		}
	}

	return {
		selectedId: items[0].id,
		normalizedId: items[0].id,
		selectedItem: items[0],
		shouldReplaceUrl: true,
	};
}

export function getNextSelectedIdAfterDelete<
	TItem extends DashboardTranscriptionItem,
>(
	items: readonly TItem[],
	deletedId: string,
	currentSelectionId: string | null,
): string | null {
	const nextItems = items.filter((item) => item.id !== deletedId);

	if (nextItems.length === 0) return null;

	if (currentSelectionId && currentSelectionId !== deletedId) {
		const selectedItem = nextItems.find((item) => item.id === currentSelectionId);
		if (selectedItem) return selectedItem.id;
	}

	const deletedIndex = items.findIndex((item) => item.id === deletedId);
	if (deletedIndex < 0) return nextItems[0].id;

	return nextItems[Math.min(deletedIndex, nextItems.length - 1)].id;
}

export function createOptimisticDeleteSelectionTransition<
	TItem extends DashboardTranscriptionItem,
>(
	items: readonly TItem[],
	deletedId: string,
	currentSelectionId: string | null,
): DashboardDeleteSelectionTransition<TItem> {
	const nextItems = items.filter((item) => item.id !== deletedId);
	const nextSelectedId = getNextSelectedIdAfterDelete(
		items,
		deletedId,
		currentSelectionId,
	);
	const nextSelectedItem =
		nextSelectedId == null
			? null
			: nextItems.find((item) => item.id === nextSelectedId) ?? null;
	const rollback = {
		items,
		selectedId: currentSelectionId,
		normalizedId: currentSelectionId,
		selectedItem:
			currentSelectionId == null
				? null
				: items.find((item) => item.id === currentSelectionId) ?? null,
	};

	return {
		next: {
			items: nextItems,
			selectedId: nextSelectedId,
			normalizedId: nextSelectedId,
			selectedItem: nextSelectedItem,
			shouldReplaceUrl: nextSelectedId !== currentSelectionId,
		},
		rollback,
	};
}
