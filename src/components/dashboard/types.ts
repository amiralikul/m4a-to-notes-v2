import type { TranscriptionSummaryData } from "@/db/schema";

export type DashboardTranscriptionStatus =
	| "pending"
	| "processing"
	| "completed"
	| "failed";

export type WorkspaceTab = "summary" | "transcript" | "chat";

export interface DashboardStatusMessage {
	code?: string;
	message?: string;
}

export interface DashboardTranscriptionItem {
	id: string;
	filename: string;
	displayName?: string | null;
	createdAt: string;
	completedAt?: string | null;
	status: DashboardTranscriptionStatus;
	progress: number;
	preview: string | null;
	summaryStatus: DashboardTranscriptionStatus | null;
	summaryUpdatedAt: string | null;
	audioKey: string;
	enableDiarization: boolean;
	translationCount: number;
}

export interface DashboardDiarizationSegment {
	speaker: string;
	text: string;
	start: number;
	end: number;
}

export interface DashboardTranscriptionDetail extends DashboardTranscriptionItem {
	transcriptionId: string;
	transcriptText: string | null;
	diarizationData: DashboardDiarizationSegment[] | null;
	error?: DashboardStatusMessage | null;
	summaryError?: DashboardStatusMessage | null;
}

export interface DashboardSummaryPayload {
	transcriptionId: string;
	summaryStatus: DashboardTranscriptionStatus;
	summaryData: TranscriptionSummaryData | null;
	summaryError?: DashboardStatusMessage | null;
	summaryUpdatedAt?: string | null;
	summaryProvider?: string | null;
	summaryModel?: string | null;
}

export interface DashboardTranslationItem {
	id: string;
	transcriptionId: string;
	language: string;
	status: DashboardTranscriptionStatus;
	translatedText: string | null;
	translatedSummary: TranscriptionSummaryData | null;
	errorDetails: DashboardStatusMessage | null;
	createdAt: string;
	completedAt: string | null;
}

export type DashboardLanguageOption = readonly [
	code: string,
	label: string,
];

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
