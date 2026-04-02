"use client";

import {
	AlertCircle,
	Loader2,
	RefreshCw,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import FileUpload from "@/components/file-upload";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { useTranscriptionRename } from "@/hooks/use-transcription-rename";
import { SUPPORTED_LANGUAGES } from "@/lib/constants/languages";
import { transcriptionKeys } from "@/lib/query-keys";
import {
	fetchSummary,
	getDetailRefetchInterval,
	getSummaryRetryDelay,
	getTimedPollingInterval,
	isTranslationQueryReady,
	shouldRetrySummary,
} from "@/components/dashboard/dashboard-workspace-queries";
import { DashboardEmptyState } from "./dashboard-empty-state";
import { DASHBOARD_WORKSPACE_GRID_CLASS } from "./layout-classes";
import {
	createOptimisticDeleteSelectionTransition,
	resolveDashboardSelection,
} from "./selection";
import { TranscriptionSidebar } from "./transcription-sidebar";
import { TranscriptionWorkspacePane } from "./transcription-workspace-pane";
import type {
	DashboardTranscriptionDetail,
	DashboardTranscriptionItem,
	DashboardTranslationItem,
	WorkspaceTab,
} from "./types";

interface TranscriptionsResponse {
	transcriptions: DashboardTranscriptionItem[];
	total: number;
}

interface TranslationsResponse {
	translations: DashboardTranslationItem[];
}

const MAX_POLLING_MS = 10 * 60 * 1000;

async function fetchTranscriptionsApi(): Promise<TranscriptionsResponse> {
	const res = await fetch("/api/me/transcriptions", { cache: "no-store" });
	if (!res.ok) throw new Error("Failed to fetch transcriptions");
	return res.json();
}

async function fetchTranscription(id: string): Promise<DashboardTranscriptionDetail> {
	const res = await fetch(`/api/transcriptions/${id}/detail`, {
		cache: "no-store",
	});
	if (!res.ok) throw new Error("Failed to fetch transcription");
	return res.json();
}

async function fetchTranslations(id: string): Promise<TranslationsResponse> {
	const res = await fetch(`/api/transcriptions/${id}/translations`, {
		cache: "no-store",
	});
	if (!res.ok) throw new Error("Failed to fetch translations");
	return res.json();
}

async function deleteTranscriptionApi(id: string): Promise<void> {
	const res = await fetch(`/api/me/transcriptions/${id}`, { method: "DELETE" });
	if (!res.ok) throw new Error("Failed to delete transcription");
}

async function requestTranslation(
	transcriptionId: string,
	language: string,
): Promise<void> {
	const res = await fetch(`/api/transcriptions/${transcriptionId}/translations`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ language }),
	});

	if (!res.ok) {
		const data = (await res.json()) as { error?: string };
		throw new Error(data.error || "Failed to request translation");
	}
}

async function deleteTranslation(
	transcriptionId: string,
	language: string,
): Promise<void> {
	const res = await fetch(
		`/api/transcriptions/${transcriptionId}/translations/${language}`,
		{ method: "DELETE" },
	);
	if (!res.ok) throw new Error("Failed to delete translation");
}

function WorkspacePaneSkeleton() {
	return (
		<Card className="overflow-hidden border-stone-200 shadow-sm">
			<CardHeader className="gap-3 border-b">
				<Skeleton className="h-7 w-48" />
				<div className="flex flex-wrap gap-2">
					<Skeleton className="h-5 w-20" />
					<Skeleton className="h-5 w-28" />
				</div>
			</CardHeader>
			<CardContent className="flex flex-col gap-5 p-6">
				<Skeleton className="h-9 w-full" />
				<Skeleton className="h-10 w-full" />
				<Skeleton className="h-40 w-full" />
			</CardContent>
		</Card>
	);
}

function WorkspacePaneErrorState({
	title,
	message,
	onRetry,
}: {
	title: string;
	message: string;
	onRetry: () => void;
}) {
	return (
		<Card className="border-red-200 shadow-sm">
			<CardHeader className="gap-2">
				<CardTitle className="flex items-center gap-2 text-base">
					<AlertCircle className="size-4 text-red-600" />
					{title}
				</CardTitle>
				<CardDescription>{message}</CardDescription>
			</CardHeader>
			<CardContent>
				<Button type="button" variant="outline" onClick={onRetry}>
					<RefreshCw data-icon="inline-start" />
					Retry
				</Button>
			</CardContent>
		</Card>
	);
}

export function DashboardWorkspace() {
	const { isLoaded, isSignedIn } = useAuth();
	const router = useRouter();
	const searchParams = useSearchParams();
	const queryClient = useQueryClient();
	const requestedId = searchParams.get("item");
	const [workspaceState, setWorkspaceState] = useState<{
		selectedId: string | null;
		activeTab: WorkspaceTab;
		selectedLanguage: string;
		viewingTranslationId: string | null;
	}>({
		selectedId: null,
		activeTab: "summary",
		selectedLanguage: "",
		viewingTranslationId: null,
	});
	const listPollingStartRef = useRef<number | null>(null);
	const summaryRetryStartRef = useRef<number | null>(null);
	const translationsPollingStartRef = useRef<number | null>(null);

	const listQuery = useQuery({
		queryKey: transcriptionKeys.list(),
		queryFn: fetchTranscriptionsApi,
		enabled: isLoaded,
		refetchInterval: (query) => {
			const transcriptions = query.state.data?.transcriptions;
			const hasInProgress = Boolean(transcriptions?.some(
				(item) =>
					item.status === "pending" ||
					item.status === "processing" ||
					(item.status === "completed" &&
						(item.summaryStatus === "pending" ||
							item.summaryStatus === "processing")),
			));
			const polling = getTimedPollingInterval({
				hasInProgress,
				startedAt: listPollingStartRef.current,
				now: Date.now(),
				maxPollingMs: MAX_POLLING_MS,
				shortIntervalMs: 5_000,
				longIntervalMs: 15_000,
			});
			listPollingStartRef.current = polling.startedAt;
			return polling.interval;
		},
	});

	const items = listQuery.data?.transcriptions ?? [];
	const hasResolvedList = isLoaded && !listQuery.isLoading;
	const selection = resolveDashboardSelection(items, requestedId);
	const selectedId = hasResolvedList ? selection.selectedId : null;
	const activeTab =
		workspaceState.selectedId === selectedId
			? workspaceState.activeTab
			: "summary";
	const selectedLanguage =
		workspaceState.selectedId === selectedId
			? workspaceState.selectedLanguage
			: "";
	const viewingTranslationId =
		workspaceState.selectedId === selectedId
			? workspaceState.viewingTranslationId
			: null;
	const renameMutation = useTranscriptionRename(selectedId ?? "");

	useEffect(() => {
		if (!hasResolvedList || listQuery.isError || !selection.shouldReplaceUrl) return;

		router.replace(
			selection.normalizedId
				? `/dashboard?item=${selection.normalizedId}`
				: "/dashboard",
		);
	}, [
		hasResolvedList,
		listQuery.isError,
		router,
		selection.normalizedId,
		selection.shouldReplaceUrl,
	]);

	useEffect(() => {
		summaryRetryStartRef.current = null;
		translationsPollingStartRef.current = null;
	}, [selectedId]);

	const detailQuery = useQuery({
		queryKey: selectedId
			? transcriptionKeys.detail(selectedId)
			: [...transcriptionKeys.all, "detail", "none"],
		queryFn: () => fetchTranscription(selectedId!),
		enabled: !!selectedId,
		refetchInterval: (query) => getDetailRefetchInterval(query.state.data ?? null),
	});

	const detail = detailQuery.data ?? null;

	const summaryQuery = useQuery({
		queryKey: selectedId
			? transcriptionKeys.summary(selectedId)
			: [...transcriptionKeys.all, "summary", "none"],
		queryFn: () => fetchSummary(selectedId!),
		enabled:
			!!selectedId &&
			(detail?.summaryStatus === "completed" ||
				detail?.summaryStatus === "failed"),
		staleTime: Infinity,
		retry: (_failureCount, error) => {
			const retryState = shouldRetrySummary({
				error,
				startedAt: summaryRetryStartRef.current,
				now: Date.now(),
				maxPollingMs: MAX_POLLING_MS,
			});
			summaryRetryStartRef.current = retryState.startedAt;
			return retryState.retry;
		},
		retryDelay: getSummaryRetryDelay,
	});
	const summary = summaryQuery.data
		? summaryQuery.data
		: detail && summaryQuery.error
			? {
					transcriptionId: detail.transcriptionId,
					summaryStatus: detail.summaryStatus ?? "failed",
					summaryData: null,
					summaryError: {
						message: summaryQuery.error.message,
					},
					summaryUpdatedAt: detail.summaryUpdatedAt,
				}
			: null;
	const translationsReady = isTranslationQueryReady({
		isLoaded,
		isSignedIn,
		selectedId,
		detail,
	});

	const translationsQuery = useQuery({
		queryKey: selectedId
			? transcriptionKeys.translations(selectedId)
			: [...transcriptionKeys.all, "translations", "none"],
		queryFn: () => fetchTranslations(selectedId!),
		enabled: translationsReady,
		refetchInterval: (query) => {
			const translations = query.state.data?.translations;
			const hasInProgress = Boolean(translations?.some(
				(item) =>
					item.status === "pending" || item.status === "processing",
			));
			const polling = getTimedPollingInterval({
				hasInProgress,
				startedAt: translationsPollingStartRef.current,
				now: Date.now(),
				maxPollingMs: MAX_POLLING_MS,
				shortIntervalMs: 3_000,
				longIntervalMs: 10_000,
			});
			translationsPollingStartRef.current = polling.startedAt;
			return polling.interval;
		},
	});

	const translations = translationsQuery.data?.translations ?? [];
	const resolvedViewingTranslationId =
		viewingTranslationId &&
		translations.some((translation) => translation.id === viewingTranslationId)
			? viewingTranslationId
			: null;

	const nonFailedLanguages = new Set(
		translations
			.filter((translation) => translation.status !== "failed")
			.map((translation) => translation.language),
	);
	const availableLanguages = translationsReady
		? Object.entries(SUPPORTED_LANGUAGES).filter(
				([language]) => !nonFailedLanguages.has(language),
			)
		: [];

	const requestTranslationMutation = useMutation({
		mutationFn: ({
			transcriptionId,
			language,
		}: {
			transcriptionId: string;
			language: string;
		}) => requestTranslation(transcriptionId, language),
		onSuccess: async (_data, variables) => {
			if (selectedId === variables.transcriptionId) {
				setWorkspaceState((current) => ({
					...(current.selectedId === variables.transcriptionId
					? current
					: {
							selectedId: variables.transcriptionId,
							activeTab: "summary" as WorkspaceTab,
							selectedLanguage: "",
							viewingTranslationId: null,
						}),
					selectedId: variables.transcriptionId,
					selectedLanguage: "",
				}));
			}
			await queryClient.invalidateQueries({
				queryKey: transcriptionKeys.translations(variables.transcriptionId),
			});
		},
	});

	const deleteTranslationMutation = useMutation({
		mutationFn: ({
			transcriptionId,
			language,
		}: {
			transcriptionId: string;
			language: string;
			translationId: string | null;
		}) => deleteTranslation(transcriptionId, language),
		onSuccess: async (_data, variables) => {
			if (
				selectedId === variables.transcriptionId &&
				variables.translationId === resolvedViewingTranslationId
			) {
				setWorkspaceState((current) => ({
					...(current.selectedId === variables.transcriptionId
						? current
						: {
								selectedId: variables.transcriptionId,
								activeTab: "summary" as WorkspaceTab,
								selectedLanguage: "",
								viewingTranslationId: null,
							}),
					selectedId: variables.transcriptionId,
					viewingTranslationId: null,
				}));
			}

			await queryClient.invalidateQueries({
				queryKey: transcriptionKeys.translations(variables.transcriptionId),
			});
		},
	});

	const deleteMutation = useMutation({
		mutationFn: deleteTranscriptionApi,
		onMutate: async (deletedId: string) => {
			await queryClient.cancelQueries({ queryKey: transcriptionKeys.list() });

			const previousList = queryClient.getQueryData<TranscriptionsResponse>(
				transcriptionKeys.list(),
			);
			const transition = createOptimisticDeleteSelectionTransition(
				items,
				deletedId,
				selectedId,
			);

			queryClient.setQueryData<TranscriptionsResponse>(
				transcriptionKeys.list(),
				(previous) => {
					if (!previous) return previous;

					return {
						...previous,
						transcriptions: transition.next.items as DashboardTranscriptionItem[],
						total: transition.next.items.length,
					};
				},
			);

			router.replace(
				transition.next.selectedId
					? `/dashboard?item=${transition.next.selectedId}`
					: "/dashboard",
			);

			return { previousList, transition };
		},
		onError: (_error, _deletedId, context) => {
			if (context?.previousList) {
				queryClient.setQueryData(transcriptionKeys.list(), context.previousList);
			}

			if (context?.transition) {
				router.replace(
					context.transition.rollback.selectedId
						? `/dashboard?item=${context.transition.rollback.selectedId}`
						: "/dashboard",
				);
			}
		},
		onSettled: async (_data, error, deletedId) => {
			if (!error) {
				queryClient.removeQueries({ queryKey: transcriptionKeys.detail(deletedId) });
				queryClient.removeQueries({ queryKey: transcriptionKeys.summary(deletedId) });
				queryClient.removeQueries({
					queryKey: transcriptionKeys.translations(deletedId),
				});
			}

			await queryClient.invalidateQueries({
				queryKey: transcriptionKeys.list(),
			});
		},
	});

	if (!isLoaded) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<Loader2 className="size-6 animate-spin text-stone-400" />
			</div>
		);
	}

	return (
		<div className="container mx-auto flex flex-col gap-6 py-8">
			<FileUpload showHistory={false} variant="dashboardCompact" />

			<div className={DASHBOARD_WORKSPACE_GRID_CLASS}>
				<TranscriptionSidebar
					items={items}
					selectedId={selectedId}
					onSelect={(id) => {
						if (id === selectedId) return;
						router.push(`/dashboard?item=${id}`);
					}}
					isLoading={listQuery.isLoading}
					error={listQuery.error}
					onRetry={() => void listQuery.refetch()}
				/>

				{selectedId == null ? (
					hasResolvedList ? (
						<DashboardEmptyState />
					) : (
						<WorkspacePaneSkeleton />
					)
				) : detailQuery.isLoading ? (
					<WorkspacePaneSkeleton />
				) : detailQuery.error ? (
					<WorkspacePaneErrorState
						title="Couldn&apos;t load transcription"
						message={detailQuery.error.message}
						onRetry={() => void detailQuery.refetch()}
					/>
				) : detail ? (
					<TranscriptionWorkspacePane
						activeTab={activeTab}
						onTabChange={(tab) =>
							setWorkspaceState((current) => ({
								...(current.selectedId === selectedId
									? current
									: {
											selectedId,
											activeTab: "summary" as WorkspaceTab,
											selectedLanguage: "",
											viewingTranslationId: null,
										}),
								selectedId,
								activeTab: tab,
							}))
						}
						transcription={detail}
						summary={summary}
						translations={translations}
						availableLanguages={availableLanguages}
						selectedLanguage={selectedLanguage}
						viewingTranslationId={resolvedViewingTranslationId}
						audioSrc={detail.audioKey}
						audioDownloadHref={detail.audioKey}
						transcriptDownloadHref={
							detail.status === "completed"
								? `/api/transcriptions/${detail.transcriptionId}/transcript`
								: undefined
						}
						onDeleteTranscription={() =>
							void deleteMutation.mutate(detail.transcriptionId)
						}
						onRenameTranscription={(nextDisplayName) =>
							renameMutation.rename(nextDisplayName)
						}
						renameIsPending={renameMutation.isPending}
						renameErrorMessage={renameMutation.errorMessage}
						onRenameErrorDismiss={renameMutation.clearError}
						onSelectedLanguageChange={(language) =>
							setWorkspaceState((current) => ({
								...(current.selectedId === selectedId
									? current
									: {
											selectedId,
											activeTab: "summary" as WorkspaceTab,
											selectedLanguage: "",
											viewingTranslationId: null,
										}),
								selectedId,
								selectedLanguage: language,
							}))
						}
						onRequestTranslation={
							translationsReady
								? (language) =>
										void requestTranslationMutation.mutate({
											transcriptionId: detail.transcriptionId,
											language,
										})
								: undefined
						}
						onToggleViewingTranslation={(translationId) =>
							setWorkspaceState((current) => {
								const currentViewingTranslationId =
									current.selectedId === selectedId
										? current.viewingTranslationId
										: null;

								return {
									...(current.selectedId === selectedId
										? current
										: {
												selectedId,
												activeTab: "summary" as WorkspaceTab,
												selectedLanguage: "",
												viewingTranslationId: null,
											}),
									selectedId,
									viewingTranslationId:
										currentViewingTranslationId === translationId
											? null
											: translationId,
								};
							})
						}
						onDeleteTranslation={(language) =>
							void deleteTranslationMutation.mutate({
								transcriptionId: detail.transcriptionId,
								language,
								translationId:
									translations.find(
										(translation) => translation.language === language,
									)?.id ?? null,
							})
						}
					/>
				) : (
					<WorkspacePaneErrorState
						title="Couldn&apos;t load transcription"
						message="The selected transcription is no longer available."
						onRetry={() => void detailQuery.refetch()}
					/>
				)}
			</div>
		</div>
	);
}
