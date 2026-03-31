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
			selectedItem: null,
			shouldReplaceUrl: false,
		};
	}

	if (requestedId) {
		const selectedItem = items.find((item) => item.id === requestedId);
		if (selectedItem) {
			return {
				selectedId: selectedItem.id,
				selectedItem,
				shouldReplaceUrl: false,
			};
		}
	}

	return {
		selectedId: items[0].id,
		selectedItem: items[0],
		shouldReplaceUrl: Boolean(requestedId),
	};
}

export function createOptimisticDeleteSelectionTransition<
	TItem extends DashboardTranscriptionItem,
>(
	items: readonly TItem[],
	deletedId: string,
	currentSelectionId: string | null,
): DashboardDeleteSelectionTransition<TItem> {
	const nextItems = items.filter((item) => item.id !== deletedId);
	const rollback = {
		items,
		selectedId: currentSelectionId,
	};

	if (nextItems.length === 0) {
		return {
			items: nextItems,
			selectedId: null,
			selectedItem: null,
			shouldReplaceUrl: true,
			rollback,
		};
	}

	const selectedItem =
		nextItems.find((item) => item.id === currentSelectionId) ?? nextItems[0];

	return {
		items: nextItems,
		selectedId: selectedItem.id,
		selectedItem,
		shouldReplaceUrl: selectedItem.id !== currentSelectionId,
		rollback,
	};
}
