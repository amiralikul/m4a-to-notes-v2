"use client";

import { useUser } from "@clerk/nextjs";
import {
	ArrowLeft,
	Download,
	FileText,
	Globe,
	Loader2,
	Trash2,
} from "lucide-react";
import { useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { transcriptionKeys } from "@/lib/query-keys";
import { SUPPORTED_LANGUAGES } from "@/lib/constants/languages";
import type { LanguageCode } from "@/lib/constants/languages";

interface TranscriptionDetail {
	transcriptionId: string;
	status: "pending" | "processing" | "completed" | "failed";
	progress: number;
	filename: string;
	createdAt: string;
	completedAt: string | null;
	preview: string | null;
	summaryStatus: "pending" | "processing" | "completed" | "failed" | null;
	summaryUpdatedAt: string | null;
	error?: { code?: string; message?: string };
	summaryError?: { code?: string; message?: string };
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
}

interface TranslationItem {
	id: string;
	transcriptionId: string;
	language: string;
	status: "pending" | "processing" | "completed" | "failed";
	translatedText: string | null;
	translatedSummary: SummaryData | null;
	errorDetails: { code?: string; message: string } | null;
	createdAt: string;
	completedAt: string | null;
}

const statusConfig = {
	pending: { label: "Pending", className: "bg-amber-100 text-amber-800" },
	processing: { label: "Processing", className: "bg-sky-100 text-sky-800" },
	completed: { label: "Completed", className: "bg-emerald-100 text-emerald-800" },
	failed: { label: "Failed", className: "bg-red-100 text-red-800" },
} as const;

const MAX_POLLING_MS = 10 * 60 * 1000;

async function fetchTranscription(id: string): Promise<TranscriptionDetail> {
	const res = await fetch(`/api/transcriptions/${id}`, { cache: "no-store" });
	if (!res.ok) throw new Error("Failed to fetch transcription");
	return res.json();
}

async function fetchSummary(id: string): Promise<SummaryPayload> {
	const res = await fetch(`/api/transcriptions/${id}/summary`, {
		cache: "no-store",
	});
	if (!res.ok) throw new Error("Failed to fetch summary");
	return res.json();
}

async function fetchTranslations(
	transcriptionId: string,
): Promise<{ translations: TranslationItem[] }> {
	const res = await fetch(
		`/api/transcriptions/${transcriptionId}/translations`,
		{ cache: "no-store" },
	);
	if (!res.ok) throw new Error("Failed to fetch translations");
	return res.json();
}

async function requestTranslation(
	transcriptionId: string,
	language: string,
): Promise<void> {
	const res = await fetch(
		`/api/transcriptions/${transcriptionId}/translations`,
		{
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ language }),
		},
	);
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

export default function TranscriptionDetailPage() {
	const { id } = useParams<{ id: string }>();
	const router = useRouter();
	const { isLoaded, isSignedIn } = useUser();
	const queryClient = useQueryClient();
	const [selectedLanguage, setSelectedLanguage] = useState<string>("");
	const [viewingTranslation, setViewingTranslation] =
		useState<TranslationItem | null>(null);
	const pollingStartRef = useRef<number | null>(null);

	const { data: transcription, isLoading: loadingTranscription } = useQuery({
		queryKey: transcriptionKeys.detail(id),
		queryFn: () => fetchTranscription(id),
		enabled: isLoaded,
	});

	const { data: summary } = useQuery({
		queryKey: transcriptionKeys.summary(id),
		queryFn: () => fetchSummary(id),
		enabled:
			transcription?.summaryStatus === "completed" ||
			transcription?.summaryStatus === "failed",
		staleTime: Infinity,
	});

	const { data: translationsData } = useQuery({
		queryKey: transcriptionKeys.translations(id),
		queryFn: () => fetchTranslations(id),
		enabled:
			isLoaded &&
			!!isSignedIn &&
			transcription?.status === "completed" &&
			transcription?.summaryStatus === "completed",
		refetchInterval: (query) => {
			const list = query.state.data?.translations;
			if (!list) return false;

			const hasInProgress = list.some(
				(t) => t.status === "pending" || t.status === "processing",
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

			return elapsed < 60_000 ? 3_000 : 10_000;
		},
	});

	const translations = translationsData?.translations ?? [];

	const translateMutation = useMutation({
		mutationFn: (language: string) => requestTranslation(id, language),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: transcriptionKeys.translations(id),
			});
			setSelectedLanguage("");
		},
	});

	const deleteMutation = useMutation({
		mutationFn: (language: string) => deleteTranslation(id, language),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: transcriptionKeys.translations(id),
			});
			setViewingTranslation(null);
		},
	});

	if (!isLoaded || loadingTranscription) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<Loader2 className="w-6 h-6 animate-spin text-stone-400" />
			</div>
		);
	}

	if (!transcription) {
		return (
			<div className="container mx-auto py-8">
				<Button
					variant="ghost"
					onClick={() => router.push("/dashboard")}
					className="mb-4"
				>
					<ArrowLeft className="w-4 h-4 mr-2" />
					Back to Dashboard
				</Button>
				<p className="text-stone-500">Transcription not found.</p>
			</div>
		);
	}

	const canTranslate =
		isSignedIn &&
		transcription.status === "completed" &&
		transcription.summaryStatus === "completed";

	const existingLanguages = new Set(translations.map((t) => t.language));
	const availableLanguages = Object.entries(SUPPORTED_LANGUAGES).filter(
		([code]) => !existingLanguages.has(code),
	);

	const displayData = viewingTranslation
		? {
				summaryData: viewingTranslation.translatedSummary,
				label: SUPPORTED_LANGUAGES[viewingTranslation.language as LanguageCode] || viewingTranslation.language,
			}
		: {
				summaryData: summary?.summaryData ?? null,
				label: "Original",
			};

	return (
		<div className="container mx-auto py-8 space-y-6">
			<div className="flex items-center gap-4">
				<Button
					variant="ghost"
					size="sm"
					onClick={() => router.push("/dashboard")}
				>
					<ArrowLeft className="w-4 h-4 mr-2" />
					Back
				</Button>
			</div>

			{/* Header */}
			<div className="flex items-center justify-between flex-wrap gap-4">
				<div>
					<h1 className="text-2xl font-display italic text-stone-900">
						{transcription.filename}
					</h1>
					<div className="flex items-center gap-2 mt-1">
						<Badge className={statusConfig[transcription.status].className}>
							{statusConfig[transcription.status].label}
						</Badge>
						{transcription.summaryStatus && (
							<Badge
								className={
									statusConfig[transcription.summaryStatus].className
								}
							>
								Summary: {statusConfig[transcription.summaryStatus].label}
							</Badge>
						)}
						<span className="text-sm text-stone-500">
							{new Date(transcription.createdAt).toLocaleDateString(
								undefined,
								{
									year: "numeric",
									month: "short",
									day: "numeric",
									hour: "2-digit",
									minute: "2-digit",
								},
							)}
						</span>
					</div>
				</div>
				<div className="flex items-center gap-2">
					{transcription.status === "completed" && (
						<Button variant="outline" size="sm" asChild>
							<a href={`/api/transcriptions/${id}/transcript`}>
								<FileText className="w-4 h-4 mr-1" />
								Download Transcript
							</a>
						</Button>
					)}
				</div>
			</div>

			{/* Transcript Preview */}
			{transcription.preview && (
				<Card>
					<CardHeader>
						<CardTitle className="text-lg">Transcript Preview</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-stone-600 whitespace-pre-wrap">
							{viewingTranslation?.translatedText ?? transcription.preview}
						</p>
						{viewingTranslation?.translatedText && (
							<p className="text-xs text-stone-400 mt-2">
								Showing {displayData.label} translation
							</p>
						)}
					</CardContent>
				</Card>
			)}

			{/* Summary */}
			{displayData.summaryData && (
				<Card>
					<CardHeader>
						<CardTitle className="text-lg">
							Summary
							{viewingTranslation && (
								<span className="text-sm font-normal text-stone-500 ml-2">
									({displayData.label})
								</span>
							)}
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div>
							<p className="font-semibold text-stone-900 text-sm">
								Overview
							</p>
							<p className="text-stone-600 text-sm mt-1">
								{displayData.summaryData.summary}
							</p>
						</div>

						<div>
							<p className="font-semibold text-stone-900 text-sm">
								Key Points
							</p>
							<ul className="list-disc pl-5 mt-1 text-stone-600 text-sm space-y-1">
								{displayData.summaryData.keyPoints.map(
									(point, index) => (
										<li key={`point-${index}`}>{point}</li>
									),
								)}
							</ul>
						</div>

						<div>
							<p className="font-semibold text-stone-900 text-sm">
								Action Items
							</p>
							{displayData.summaryData.actionItems.length === 0 ? (
								<p className="text-stone-500 text-sm mt-1">
									No action items found.
								</p>
							) : (
								<ul className="list-disc pl-5 mt-1 text-stone-600 text-sm space-y-1">
									{displayData.summaryData.actionItems.map(
										(item, index) => (
											<li key={`action-${index}`}>
												{item.task}
												{item.owner && ` (Owner: ${item.owner})`}
												{item.dueDate && ` (Due: ${item.dueDate})`}
											</li>
										),
									)}
								</ul>
							)}
						</div>

						<div>
							<p className="font-semibold text-stone-900 text-sm">
								Key Takeaways
							</p>
							<ul className="list-disc pl-5 mt-1 text-stone-600 text-sm space-y-1">
								{displayData.summaryData.keyTakeaways.map(
									(takeaway, index) => (
										<li key={`takeaway-${index}`}>{takeaway}</li>
									),
								)}
							</ul>
						</div>
					</CardContent>
				</Card>
			)}

			{/* Translation Panel */}
			{canTranslate && (
				<Card>
					<CardHeader>
						<CardTitle className="text-lg flex items-center gap-2">
							<Globe className="w-5 h-5" />
							Translations
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						{/* Request new translation */}
						<div className="flex items-center gap-3">
							<Select
								value={selectedLanguage}
								onValueChange={setSelectedLanguage}
							>
								<SelectTrigger className="w-[200px]">
									<SelectValue placeholder="Select language" />
								</SelectTrigger>
								<SelectContent>
									{availableLanguages.map(([code, name]) => (
										<SelectItem key={code} value={code}>
											{name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							<Button
								size="sm"
								disabled={
									!selectedLanguage || translateMutation.isPending
								}
								onClick={() => translateMutation.mutate(selectedLanguage)}
							>
								{translateMutation.isPending ? (
									<Loader2 className="w-4 h-4 animate-spin mr-1" />
								) : (
									<Globe className="w-4 h-4 mr-1" />
								)}
								Translate
							</Button>
						</div>

						{translateMutation.isError && (
							<p className="text-sm text-red-600">
								{translateMutation.error.message}
							</p>
						)}

						{/* Existing translations list */}
						{translations.length > 0 && (
							<div className="space-y-2">
								<p className="text-sm font-medium text-stone-700">
									Translations
								</p>
								{translations.map((t) => (
									<div
										key={t.id}
										className="flex items-center justify-between p-3 rounded-lg border border-stone-200"
									>
										<div className="flex items-center gap-3">
											<span className="text-sm font-medium">
												{SUPPORTED_LANGUAGES[
													t.language as LanguageCode
												] || t.language}
											</span>
											<Badge
												className={
													statusConfig[t.status].className
												}
											>
												{statusConfig[t.status].label}
											</Badge>
										</div>
										<div className="flex items-center gap-2">
											{t.status === "completed" && (
												<Button
													variant="outline"
													size="sm"
													onClick={() =>
														setViewingTranslation(
															viewingTranslation?.id === t.id
																? null
																: t,
														)
													}
												>
													{viewingTranslation?.id === t.id
														? "Show Original"
														: "View"}
												</Button>
											)}
											{t.status === "processing" ||
											t.status === "pending" ? (
												<Loader2 className="w-4 h-4 animate-spin text-stone-400" />
											) : null}
											<Button
												variant="outline"
												size="sm"
												onClick={() =>
													deleteMutation.mutate(t.language)
												}
												disabled={deleteMutation.isPending}
												className="text-red-600 hover:text-red-700 hover:bg-red-50"
											>
												<Trash2 className="w-4 h-4" />
											</Button>
										</div>
									</div>
								))}
							</div>
						)}

						{availableLanguages.length === 0 &&
							translations.length > 0 && (
								<p className="text-sm text-stone-500">
									All supported languages have been translated.
								</p>
							)}
					</CardContent>
				</Card>
			)}

			{/* Error display */}
			{transcription.error && (
				<Card className="border-red-200 bg-red-50">
					<CardContent className="pt-6">
						<p className="text-red-600 text-sm">
							Error: {transcription.error.message}
						</p>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
