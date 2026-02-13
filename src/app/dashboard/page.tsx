"use client";

import { useUser } from "@clerk/nextjs";
import {
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
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

interface TranscriptionItem {
	id: string;
	filename: string;
	status: "pending" | "processing" | "completed" | "failed";
	progress: number;
	preview: string | null;
	createdAt: string;
	completedAt: string | null;
	audioKey: string;
}

const statusConfig = {
	pending: { label: "Pending", className: "bg-yellow-100 text-yellow-800" },
	processing: { label: "Processing", className: "bg-blue-100 text-blue-800" },
	completed: { label: "Completed", className: "bg-green-100 text-green-800" },
	failed: { label: "Failed", className: "bg-red-100 text-red-800" },
} as const;

export default function DashboardPage() {
	const { user, isLoaded } = useUser();
	const [transcriptions, setTranscriptions] = useState<TranscriptionItem[]>(
		[],
	);
	const [total, setTotal] = useState(0);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
	const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

	const fetchTranscriptions = useCallback(async () => {
		try {
			const res = await fetch("/api/me/transcriptions");
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

	useEffect(() => {
		if (isLoaded && user) {
			fetchTranscriptions();
		}
	}, [isLoaded, user, fetchTranscriptions]);

	// Poll while any transcription is in-progress
	useEffect(() => {
		const hasInProgress = transcriptions.some(
			(t) => t.status === "pending" || t.status === "processing",
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

	if (!isLoaded) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<Loader2 className="w-6 h-6 animate-spin text-gray-400" />
			</div>
		);
	}

	if (!user) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<Card className="w-96">
					<CardHeader>
						<CardTitle>Authentication Required</CardTitle>
						<CardDescription>
							Please sign in to view your transcriptions
						</CardDescription>
					</CardHeader>
				</Card>
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

			<FileUpload />

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
							<p className="text-lg font-medium">
								No transcriptions yet
							</p>
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
										<div className="flex items-center gap-3 mb-1">
											<span className="font-medium truncate">
												{t.filename}
											</span>
											<Badge
												className={
													statusConfig[t.status].className
												}
											>
												{statusConfig[t.status].label}
												{(t.status === "processing" ||
													t.status === "pending") &&
													` ${t.progress}%`}
											</Badge>
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
										{t.status === "completed" && (
											<Button
												variant="outline"
												size="sm"
												asChild
											>
												<a
													href={`/api/transcriptions/${t.id}/transcript`}
												>
													<FileText className="w-4 h-4 mr-1" />
													Transcript
												</a>
											</Button>
										)}
										{t.audioKey && (
											<Button
												variant="outline"
												size="sm"
												asChild
											>
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
							</CardContent>
						</Card>
					))}
				</div>
			)}
		</div>
	);
}
