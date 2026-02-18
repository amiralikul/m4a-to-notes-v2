"use client";

import { useUser } from "@clerk/nextjs";
import {
	ChevronDown,
	ChevronUp,
	Download,
	FileAudio,
	FileText,
	Loader2,
	RefreshCw,
	Trash2,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import FileUpload from "@/components/file-upload";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
} from "@/components/ui/card";

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

const statusConfig = {
	pending: { label: "Pending", className: "bg-yellow-100 text-yellow-800" },
	processing: {
		label: "Processing",
		className: "bg-blue-100 text-blue-800",
	},
	completed: {
		label: "Completed",
		className: "bg-green-100 text-green-800",
	},
	failed: { label: "Failed", className: "bg-red-100 text-red-800" },
} as const;

const summaryStatusConfig = {
	not_generated: {
		label: "Summary: Not generated",
		className: "bg-gray-100 text-gray-700",
	},
	pending: {
		label: "Summary: Pending",
		className: "bg-yellow-100 text-yellow-800",
	},
	processing: {
		label: "Summary: Generating",
		className: "bg-blue-100 text-blue-800",
	},
	completed: {
		label: "Summary: Ready",
		className: "bg-green-100 text-green-800",
	},
	failed: {
		label: "Summary: Failed",
		className: "bg-red-100 text-red-800",
	},
} as const;

export default function DashboardPage() {
	const { isLoaded, isSignedIn } = useUser();
	const [transcriptions, setTranscriptions] = useState<TranscriptionItem[]>(
		[],
	);
	const [total, setTotal] = useState(0);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
	const [expandedSummaryIds, setExpandedSummaryIds] = useState<Set<string>>(
		new Set(),
	);
	const [summaryLoadingIds, setSummaryLoadingIds] = useState<Set<string>>(
		new Set(),
	);
	const [summaryById, setSummaryById] = useState<
		Record<string, SummaryPayload>
	>({});
	const [summaryErrors, setSummaryErrors] = useState<Record<string, string>>(
		{},
	);
	const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

	const fetchTranscriptions = useCallback(async () => {
		try {
			const res = await fetch("/api/me/transcriptions", {
				cache: "no-store",
			});
			if (!res.ok) {
				setError("Failed to fetch transcriptions");
				return;
			}
			const data = await res.json();
			setTranscriptions(data.transcriptions);
			setTotal(data.total);
			setError(null);
		} catch {
			setError("Something went wrong");
		} finally {
			setLoading(false);
		}
	}, []);

	const fetchSummary = useCallback(async (transcriptionId: string) => {
		setSummaryLoadingIds((prev) => {
			const next = new Set(prev);
			next.add(transcriptionId);
			return next;
		});

		try {
			const res = await fetch(`/api/transcriptions/${transcriptionId}/summary`, {
				cache: "no-store",
			});

			if (!res.ok) {
				if (res.status === 404) {
					setSummaryErrors((prev) => ({
						...prev,
						[transcriptionId]: "Summary is not available yet.",
					}));
					return;
				}

				setSummaryErrors((prev) => ({
					...prev,
					[transcriptionId]: `Failed to fetch summary (${res.status})`,
				}));
				return;
			}

			const payload = (await res.json()) as SummaryPayload;
			setSummaryById((prev) => ({
				...prev,
				[transcriptionId]: payload,
			}));
			setSummaryErrors((prev) => {
				const next = { ...prev };
				delete next[transcriptionId];
				return next;
			});
		} catch {
			setSummaryErrors((prev) => ({
				...prev,
				[transcriptionId]: "Failed to fetch summary. Please try again.",
			}));
		} finally {
			setSummaryLoadingIds((prev) => {
				const next = new Set(prev);
				next.delete(transcriptionId);
				return next;
			});
		}
	}, []);

	useEffect(() => {
		if (isLoaded) {
			fetchTranscriptions();
		}
	}, [isLoaded, fetchTranscriptions]);

	useEffect(() => {
		if (!isSignedIn) {
			return;
		}

		for (const transcription of transcriptions) {
			const id = transcription.id;
			const shouldFetch =
				expandedSummaryIds.has(id) &&
				(transcription.summaryStatus === "completed" ||
					transcription.summaryStatus === "failed") &&
				!summaryById[id] &&
				!summaryErrors[id] &&
				!summaryLoadingIds.has(id);

			if (shouldFetch) {
				void fetchSummary(id);
			}
		}
	}, [
		transcriptions,
		expandedSummaryIds,
		summaryById,
		summaryErrors,
		summaryLoadingIds,
		fetchSummary,
		isSignedIn,
	]);

	// Poll while any transcription or summary generation is in-progress.
	useEffect(() => {
		const hasInProgress = transcriptions.some(
			(t) =>
				t.status === "pending" ||
				t.status === "processing" ||
				(t.status === "completed" &&
					(t.summaryStatus === "pending" ||
						t.summaryStatus === "processing")),
		);

		if (hasInProgress) {
			intervalRef.current = setInterval(fetchTranscriptions, 3000);
		} else if (intervalRef.current) {
			clearInterval(intervalRef.current);
			intervalRef.current = null;
		}

		return () => {
			if (intervalRef.current) {
				clearInterval(intervalRef.current);
				intervalRef.current = null;
			}
		};
	}, [transcriptions, fetchTranscriptions]);

	const handleDelete = async (id: string) => {
		setDeletingIds((prev) => new Set(prev).add(id));
		try {
			const res = await fetch(`/api/me/transcriptions/${id}`, {
				method: "DELETE",
			});
			if (!res.ok) throw new Error("Failed to delete");
			setTranscriptions((prev) => prev.filter((t) => t.id !== id));
			setExpandedSummaryIds((prev) => {
				const next = new Set(prev);
				next.delete(id);
				return next;
			});
			setSummaryLoadingIds((prev) => {
				const next = new Set(prev);
				next.delete(id);
				return next;
			});
			setSummaryById((prev) => {
				const next = { ...prev };
				delete next[id];
				return next;
			});
			setSummaryErrors((prev) => {
				const next = { ...prev };
				delete next[id];
				return next;
			});
			setTotal((prev) => prev - 1);
		} catch {
			setError("Failed to delete transcription");
		} finally {
			setDeletingIds((prev) => {
				const next = new Set(prev);
				next.delete(id);
				return next;
			});
		}
	};

	const handleToggleSummary = (transcription: TranscriptionItem) => {
		if (!isSignedIn) {
			return;
		}

		const id = transcription.id;
		const isExpanded = expandedSummaryIds.has(id);

		setExpandedSummaryIds((prev) => {
			const next = new Set(prev);
			if (isExpanded) {
				next.delete(id);
			} else {
				next.add(id);
			}
			return next;
		});

		if (
			!isExpanded &&
			(transcription.summaryStatus === "completed" ||
				transcription.summaryStatus === "failed") &&
			!summaryById[id] &&
			!summaryLoadingIds.has(id)
		) {
			void fetchSummary(id);
		}
	};

	const renderSummarySection = (transcription: TranscriptionItem) => {
		if (!isSignedIn) {
			return null;
		}

		const id = transcription.id;
		if (!expandedSummaryIds.has(id)) {
			return null;
		}

		const summary = summaryById[id];
		const summaryErrorMessage =
			summaryErrors[id] || summary?.summaryError?.message;

		return (
			<div className="mt-4 border-t pt-4 space-y-3">
				{summaryLoadingIds.has(id) && (
					<div className="flex items-center gap-2 text-sm text-gray-600">
						<Loader2 className="w-4 h-4 animate-spin" />
						Loading summary...
					</div>
				)}

				{!summaryLoadingIds.has(id) && summary?.summaryData && (
					<div className="space-y-3 text-sm">
						<div>
							<p className="font-semibold text-gray-900">Summary</p>
							<p className="text-gray-700 mt-1">
								{summary.summaryData.summary}
							</p>
						</div>

						<div>
							<p className="font-semibold text-gray-900">Key Points</p>
							<ul className="list-disc pl-5 mt-1 text-gray-700 space-y-1">
								{summary.summaryData.keyPoints.map((point, index) => (
									<li key={`${id}-point-${index}`}>{point}</li>
								))}
							</ul>
						</div>

						<div>
							<p className="font-semibold text-gray-900">Action Items</p>
							{summary.summaryData.actionItems.length === 0 ? (
								<p className="text-gray-600 mt-1">
									No action items found.
								</p>
							) : (
								<ul className="list-disc pl-5 mt-1 text-gray-700 space-y-1">
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
							<p className="font-semibold text-gray-900">
								Key Takeaways
							</p>
							<ul className="list-disc pl-5 mt-1 text-gray-700 space-y-1">
								{summary.summaryData.keyTakeaways.map(
									(takeaway, index) => (
										<li key={`${id}-takeaway-${index}`}>{takeaway}</li>
									),
								)}
							</ul>
						</div>
					</div>
				)}

				{!summaryLoadingIds.has(id) && !summary?.summaryData && (
					<div className="text-sm text-gray-600">
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
	};

	if (!isLoaded) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<Loader2 className="w-6 h-6 animate-spin text-gray-400" />
			</div>
		);
	}

	if (loading) {
		return (
			<div className="container mx-auto py-8">
				<div className="space-y-4 animate-pulse">
					<div className="h-8 bg-gray-200 rounded w-64" />
					<div className="h-4 bg-gray-200 rounded w-48" />
					<div className="space-y-3 mt-6">
						{[1, 2, 3].map((i) => (
							<div key={i} className="h-24 bg-gray-200 rounded" />
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
					<h1 className="text-3xl font-bold">Dashboard</h1>
					<p className="text-gray-600">
						{total} transcription{total !== 1 ? "s" : ""}
					</p>
				</div>
				<Button
					variant="outline"
					size="sm"
					onClick={() => {
						setLoading(true);
						fetchTranscriptions();
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
							<span>{error}</span>
							<Button
								onClick={() => {
									setError(null);
									setLoading(true);
									fetchTranscriptions();
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
						<div className="text-center py-12 text-gray-500">
							<FileAudio className="w-12 h-12 mx-auto mb-4 text-gray-300" />
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
						<Card key={t.id}>
							<CardContent className="py-4">
								<div className="flex items-center justify-between gap-4">
									<div className="min-w-0 flex-1">
										<div className="flex items-center gap-3 mb-1 flex-wrap">
											<span className="font-medium truncate">
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
										<div className="text-sm text-gray-500">
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
											<p className="text-sm text-gray-600 mt-1 line-clamp-2">
												{t.preview}
											</p>
										)}
									</div>

										<div className="flex items-center gap-2 shrink-0">
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
												onClick={() => handleDelete(t.id)}
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
