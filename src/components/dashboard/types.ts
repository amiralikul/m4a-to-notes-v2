export type DashboardTranscriptionStatus =
	| "pending"
	| "processing"
	| "completed"
	| "failed";

export interface DashboardTranscriptionItem {
	id: string;
	filename: string;
	createdAt: string;
	status: DashboardTranscriptionStatus;
	progress: number;
	preview: string | null;
	summaryStatus: DashboardTranscriptionStatus | null;
	summaryUpdatedAt: string | null;
	audioKey: string;
	enableDiarization: boolean;
	translationCount: number;
}

export interface DashboardSelectionState<TItem extends DashboardTranscriptionItem> {
	selectedId: string | null;
	normalizedId: string | null;
	selectedItem: TItem | null;
	shouldReplaceUrl: boolean;
}

export interface DashboardSelectionRollback<TItem extends DashboardTranscriptionItem> {
	items: readonly TItem[];
	selectedId: string | null;
	normalizedId: string | null;
	selectedItem: TItem | null;
}

export interface DashboardSelectionSnapshot<TItem extends DashboardTranscriptionItem>
	extends DashboardSelectionState<TItem> {
	items: readonly TItem[];
}

export interface DashboardDeleteSelectionTransition<
	TItem extends DashboardTranscriptionItem,
> {
	next: DashboardSelectionSnapshot<TItem>;
	rollback: DashboardSelectionRollback<TItem>;
}
