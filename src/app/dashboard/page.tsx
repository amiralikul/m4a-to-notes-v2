"use client";

import { useUser } from "@clerk/nextjs";
import {
	ChevronDown,
	ChevronUp,
	Download,
	ExternalLink,
	FileAudio,
	FileText,
	Loader2,
	RefreshCw,
	Trash2,
} from "lucide-react";
import { CopyButton } from "@/components/copy-button";
import { useRef, useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import FileUpload from "@/components/file-upload";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
} from "@/components/ui/card";
import { transcriptionKeys } from "@/lib/query-keys";

interface TranscriptionItem {
	id: string;
	filename: string;
	status: "pending" | "processing" | "completed" | "failed";
	progress: number;
	preview: string | null;
	summaryStatus:
		| "pending"
		| "processing"
		| "completed"
		| "failed"
		| null;
	summaryUpdatedAt: string | null;
	createdAt: string;
	completedAt: string | null;
	audioKey: string;
}

interface SummaryActionItem {
	task: string;
	owner?: string;
	dueDate?: string;
}

interface SummaryData {
	summary: string;
	keyPoints: string[];
	actionItems: SummaryActionItem[];
	keyTakeaways: string[];
}

interface SummaryPayload {
	transcriptionId: string;
	summaryStatus: "pending" | "processing" | "completed" | "failed";
	summaryData: SummaryData | null;
	summaryError?: {
		code?: string;
		message?: string;
	} | null;
	summaryProvider?: string | null;
	summaryModel?: string | null;
	summaryUpdatedAt?: string | null;
}

interface TranscriptionsResponse {
	transcriptions: TranscriptionItem[];
	total: number;
}

const statusConfig = {
	pending: { label: "Pending", className: "bg-amber-100 text-amber-800" },
	processing: {
		label: "Processing",
		className: "bg-sky-100 text-sky-800",
	},
	completed: {
		label: "Completed",
		className: "bg-emerald-100 text-emerald-800",
	},
	failed: { label: "Failed", className: "bg-red-100 text-red-800" },
} as const;

const summaryStatusConfig = {
	not_generated: {
		label: "Summary: Not generated",
		className: "bg-stone-100 text-stone-700",
	},
	pending: {
		label: "Summary: Pending",
		className: "bg-amber-100 text-amber-800",
	},
	processing: {
		label: "Summary: Generating",
		className: "bg-sky-100 text-sky-800",
	},
	completed: {
		label: "Summary: Ready",
		className: "bg-emerald-100 text-emerald-800",
	},
	failed: {
		label: "Summary: Failed",
		className: "bg-red-100 text-red-800",
	},
} as const;

const MAX_POLLING_MS = 10 * 60 * 1000; // 10 minutes

async function fetchTranscriptionsApi(): Promise<TranscriptionsResponse> {
	const res = await fetch("/api/me/transcriptions", { cache: "no-store" });
	if (!res.ok) throw new Error("Failed to fetch transcriptions");
	return res.json();
}

async function fetchSummaryApi(transcriptionId: string): Promise<SummaryPayload> {
	const res = await fetch(`/api/transcriptions/${transcriptionId}/summary`, {
		cache: "no-store",
	});
	if (!res.ok) {
		if (res.status === 404) throw new Error("Summary is not available yet.");
		throw new Error(`Failed to fetch summary (${res.status})`);
	}
	return res.json();
}

async function deleteTranscriptionApi(id: string): Promise<void> {
	const res = await fetch(`/api/me/transcriptions/${id}`, { method: "DELETE" });
	if (!res.ok) throw new Error("Failed to delete");
}

export default function DashboardPage() {
	const { isLoaded, isSignedIn } = useUser();
	const queryClient = useQueryClient();
	const [expandedSummaryIds, setExpandedSummaryIds] = useState<Set<string>>(
		new Set(),
	);
	const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
	const pollingStartRef = useRef<number | null>(null);

	const {
		data,
		isLoading,
		error,
	} = useQuery({
		queryKey: transcriptionKeys.list(),
		queryFn: fetchTranscriptionsApi,
		enabled: isLoaded,
		refetchInterval: (query) => {
			const transcriptions = query.state.data?.transcriptions;
			if (!transcriptions) return false;

			const hasInProgress = transcriptions.some(
				(t) =>
					t.status === "pending" ||
					t.status === "processing" ||
					(t.status === "completed" &&
						(t.summaryStatus === "pending" ||
							t.summaryStatus === "processing")),
			);

			if (!hasInProgress) {
				pollingStartRef.current = null;
				return false;
			}

			if (!pollingStartRef.current) {
				pollingStartRef.current = Date.now();
			}

			const elapsed = Date.now() - pollingStartRef.current;
			if (elapsed > MAX_POLLING_MS) return false;

			return elapsed < 60_000 ? 5_000 : 15_000;
		},
	});

	const transcriptions = data?.transcriptions ?? [];
	const total = data?.total ?? 0;

	const deleteMutation = useMutation({
		mutationFn: deleteTranscriptionApi,
		onMutate: async (id) => {
			await queryClient.cancelQueries({ queryKey: transcriptionKeys.list() });

			const previous = queryClient.getQueryData<TranscriptionsResponse>(
				transcriptionKeys.list(),
			);

			queryClient.setQueryData<TranscriptionsResponse>(
				transcriptionKeys.list(),
				(old) => {
					if (!old) return old;
					return {
						transcriptions: old.transcriptions.filter((t) => t.id !== id),
						total: old.total - 1,
					};
				},
			);

			setDeletingIds((prev) => new Set(prev).add(id));
			setExpandedSummaryIds((prev) => {
				const next = new Set(prev);
				next.delete(id);
				return next;
			});

			return { previous };
		},
		onError: (_error, _id, context) => {
			if (context?.previous) {
				queryClient.setQueryData(transcriptionKeys.list(), context.previous);
			}
		},
		onSettled: (_data, _error, id) => {
			setDeletingIds((prev) => {
				const next = new Set(prev);
				next.delete(id);
				return next;
			});
			queryClient.removeQueries({ queryKey: transcriptionKeys.detail(id) });
			queryClient.invalidateQueries({ queryKey: transcriptionKeys.list() });
		},
	});

	const handleToggleSummary = (transcription: TranscriptionItem) => {
		if (!isSignedIn) return;

		const id = transcription.id;
		setExpandedSummaryIds((prev) => {
			const next = new Set(prev);
			if (next.has(id)) {
				next.delete(id);
			} else {
				next.add(id);
			}
			return next;
		});
	};

	const renderSummarySection = (transcription: TranscriptionItem) => {
		if (!isSignedIn) return null;
		if (!expandedSummaryIds.has(transcription.id)) return null;

		return <SummarySection transcription={transcription} />;
	};

	if (!isLoaded) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<Loader2 className="w-6 h-6 animate-spin text-stone-400" />
			</div>
		);
	}

	if (isLoading) {
		return (
			<div className="container mx-auto py-8">
				<div className="space-y-4 animate-pulse">
					<div className="h-8 bg-stone-200 rounded w-64" />
					<div className="h-4 bg-stone-200 rounded w-48" />
					<div className="space-y-3 mt-6">
						{[1, 2, 3].map((i) => (
							<div key={i} className="h-24 bg-stone-200 rounded-xl" />
						))}
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="container mx-auto py-8 space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-display italic text-stone-900">
						Dashboard
					</h1>
					<p className="text-stone-500">
						{total} transcription{total !== 1 ? "s" : ""}
					</p>
				</div>
				<Button
					variant="outline"
					size="sm"
					onClick={() => {
						queryClient.invalidateQueries({ queryKey: transcriptionKeys.all });
					}}
				>
					<RefreshCw className="w-4 h-4 mr-2" />
					Refresh
				</Button>
			</div>

			<FileUpload showHistory={false} />

			{error && (
				<Card className="border-red-200 bg-red-50">
					<CardContent className="pt-6">
						<div className="flex items-center justify-between text-red-600">
							<span>{error.message}</span>
							<Button
								onClick={() => {
									queryClient.invalidateQueries({ queryKey: transcriptionKeys.all });
								}}
								size="sm"
								variant="outline"
							>
								Retry
							</Button>
						</div>
					</CardContent>
				</Card>
			)}

			{transcriptions.length === 0 && !error ? (
				<Card>
					<CardContent className="pt-6">
						<div className="text-center py-12 text-stone-500">
							<FileAudio className="w-12 h-12 mx-auto mb-4 text-stone-300" />
							<p className="text-lg font-medium">No transcriptions yet</p>
							<p className="text-sm mt-1">
								Upload an audio file to get started
							</p>
						</div>
					</CardContent>
				</Card>
			) : (
				<div className="space-y-3">
					{transcriptions.map((t) => (
						<Card key={t.id} className="border border-stone-200">
							<CardContent className="py-4">
								<div className="flex items-center justify-between gap-4">
									<div className="min-w-0 flex-1">
										<div className="flex items-center gap-3 mb-1 flex-wrap">
											<span className="font-medium truncate text-stone-900">
												{t.filename}
											</span>
											<Badge className={statusConfig[t.status].className}>
												{statusConfig[t.status].label}
												{(t.status === "processing" ||
													t.status === "pending") &&
													` ${t.progress}%`}
											</Badge>
											{isSignedIn && t.status === "completed" && (
												<Badge
													className={
														summaryStatusConfig[
															t.summaryStatus ?? "not_generated"
														].className
													}
												>
													{
														summaryStatusConfig[
																t.summaryStatus ?? "not_generated"
															].label
													}
												</Badge>
											)}
										</div>
										<div className="text-sm text-stone-500">
											{new Date(t.createdAt).toLocaleDateString(
												undefined,
												{
													year: "numeric",
													month: "short",
													day: "numeric",
													hour: "2-digit",
													minute: "2-digit",
												},
											)}
										</div>
										{t.preview && (
											<p className="text-sm text-stone-500 mt-1 line-clamp-2">
												{t.preview}
											</p>
										)}
									</div>

										<div className="flex items-center gap-2 shrink-0">
											{isSignedIn && t.status === "completed" && (
												<Button variant="outline" size="sm" asChild>
													<Link href={`/dashboard/${t.id}`}>
														<ExternalLink className="w-4 h-4 mr-1" />
														Details
													</Link>
												</Button>
											)}
											{isSignedIn && t.status === "completed" && (
												<Button
													variant="outline"
													size="sm"
													onClick={() =>
														handleToggleSummary(t)
													}
												>
													{expandedSummaryIds.has(t.id) ? (
														<>
															<ChevronUp className="w-4 h-4 mr-1" />
															Hide Summary
														</>
													) : (
														<>
															<ChevronDown className="w-4 h-4 mr-1" />
															View Summary
														</>
													)}
												</Button>
											)}
											{t.status === "completed" && (
												<Button variant="outline" size="sm" asChild>
													<a href={`/api/transcriptions/${t.id}/transcript`}>
														<FileText className="w-4 h-4 mr-1" />
														Transcript
													</a>
												</Button>
											)}
											{t.audioKey && (
												<Button variant="outline" size="sm" asChild>
													<a
														href={t.audioKey}
														target="_blank"
														rel="noopener noreferrer"
													>
														<Download className="w-4 h-4 mr-1" />
														Audio
													</a>
												</Button>
											)}
											<Button
												variant="outline"
												size="sm"
												onClick={() => deleteMutation.mutate(t.id)}
												disabled={deletingIds.has(t.id)}
												className="text-red-600 hover:text-red-700 hover:bg-red-50"
											>
												{deletingIds.has(t.id) ? (
													<Loader2 className="w-4 h-4 animate-spin" />
												) : (
													<Trash2 className="w-4 h-4" />
												)}
											</Button>
										</div>
								</div>
								{renderSummarySection(t)}
							</CardContent>
						</Card>
					))}
				</div>
			)}
		</div>
	);
}

function SummarySection({ transcription }: { transcription: TranscriptionItem }) {
	const id = transcription.id;
	const summaryContentRef = useRef<HTMLDivElement>(null);

	const { data: summary, isLoading, error } = useQuery({
		queryKey: transcriptionKeys.summary(id),
		queryFn: () => fetchSummaryApi(id),
		enabled:
			transcription.summaryStatus === "completed" ||
			transcription.summaryStatus === "failed",
		staleTime: Infinity,
	});

	const summaryErrorMessage =
		error?.message || summary?.summaryError?.message;

	return (
		<div className="mt-4 border-t border-stone-200 pt-4 space-y-3">
			{isLoading && (
				<div className="flex items-center gap-2 text-sm text-stone-600">
					<Loader2 className="w-4 h-4 animate-spin" />
					Loading summary...
				</div>
			)}

			{!isLoading && summary?.summaryData && (
				<div className="space-y-3 text-sm">
					<div className="flex items-center justify-between">
						<p className="font-semibold text-stone-900">Summary</p>
						<CopyButton contentRef={summaryContentRef} />
					</div>
					<div ref={summaryContentRef}>
					<div>
						<p className="text-stone-600 mt-1">
							{summary.summaryData.summary}
						</p>
					</div>

					<div>
						<p className="font-semibold text-stone-900">Key Points</p>
						<ul className="list-disc pl-5 mt-1 text-stone-600 space-y-1">
							{summary.summaryData.keyPoints.map((point, index) => (
								<li key={`${id}-point-${index}`}>{point}</li>
							))}
						</ul>
					</div>

					<div>
						<p className="font-semibold text-stone-900">Action Items</p>
						{summary.summaryData.actionItems.length === 0 ? (
							<p className="text-stone-500 mt-1">
								No action items found.
							</p>
						) : (
							<ul className="list-disc pl-5 mt-1 text-stone-600 space-y-1">
								{summary.summaryData.actionItems.map((item, index) => (
									<li key={`${id}-action-${index}`}>
										{item.task}
										{item.owner && ` (Owner: ${item.owner})`}
										{item.dueDate && ` (Due: ${item.dueDate})`}
									</li>
								))}
							</ul>
						)}
					</div>

					<div>
						<p className="font-semibold text-stone-900">
							Key Takeaways
						</p>
						<ul className="list-disc pl-5 mt-1 text-stone-600 space-y-1">
							{summary.summaryData.keyTakeaways.map(
								(takeaway, index) => (
									<li key={`${id}-takeaway-${index}`}>{takeaway}</li>
								),
							)}
						</ul>
					</div>
					</div>
				</div>
			)}

			{!isLoading && !summary?.summaryData && (
				<div className="text-sm text-stone-500">
					{summaryErrorMessage ||
						(transcription.summaryStatus === "failed"
							? "Summary generation failed."
							: transcription.summaryStatus === "pending" ||
								  transcription.summaryStatus === "processing"
								? "Summary is being generated. Check back in a few seconds."
								: "Summary was not generated for this transcription.")}
				</div>
			)}
		</div>
	);
}
