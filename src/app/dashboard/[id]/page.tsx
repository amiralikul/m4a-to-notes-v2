"use client";

import {
	ArrowLeft,
	FileText,
	Globe,
	Loader2,
	RefreshCw,
	Trash2,
	Users,
} from "lucide-react";
import { CopyButton } from "@/components/copy-button";
import { SummaryRenderer, ContentTypeBadge } from "@/components/summary-renderer";
import { TranscriptionChat } from "@/components/transcription-chat";
import type { TranscriptionSummaryData } from "@/db/schema";
import { isFlexibleSummary } from "@/db/schema";
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
import { TranscriptionTitleEditor } from "@/components/transcription-title-editor";
import { transcriptionKeys } from "@/lib/query-keys";
import { SUPPORTED_LANGUAGES } from "@/lib/constants/languages";
import type { LanguageCode } from "@/lib/constants/languages";
import { useAuth } from "@/hooks/use-auth";
import { useTranscriptionRename } from "@/hooks/use-transcription-rename";

interface DiarizationSegment {
	speaker: string;
	text: string;
	start: number;
	end: number;
}

interface TranscriptionDetail {
	transcriptionId: string;
	status: "pending" | "processing" | "completed" | "failed";
	progress: number;
	filename: string;
	displayName: string | null;
	createdAt: string;
	completedAt: string | null;
	preview: string | null;
	enableDiarization: boolean;
	diarizationData: DiarizationSegment[] | null;
	transcriptText: string | null;
	summaryStatus: "pending" | "processing" | "completed" | "failed" | null;
	summaryUpdatedAt: string | null;
	error?: { code?: string; message?: string };
	summaryError?: { code?: string; message?: string };
}

interface SummaryPayload {
	transcriptionId: string;
	summaryStatus: "pending" | "processing" | "completed" | "failed";
	summaryData: TranscriptionSummaryData | null;
}

interface TranslationItem {
	id: string;
	transcriptionId: string;
	language: string;
	status: "pending" | "processing" | "completed" | "failed";
	translatedText: string | null;
	translatedSummary: TranscriptionSummaryData | null;
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

function formatTimestamp(ms: number): string {
	const totalSeconds = Math.floor(ms / 1000);
	const minutes = Math.floor(totalSeconds / 60);
	const seconds = totalSeconds % 60;
	return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

async function fetchTranscription(id: string): Promise<TranscriptionDetail> {
	const res = await fetch(`/api/transcriptions/${id}/detail`, { cache: "no-store" });
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
	const { isLoaded, isSignedIn } = useAuth();
	const queryClient = useQueryClient();
	const renameMutation = useTranscriptionRename(id);
	const [selectedLanguage, setSelectedLanguage] = useState<string>("");
	const transcriptRef = useRef<HTMLDivElement>(null);
	const summaryRef = useRef<HTMLDivElement>(null);
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

	const nonFailedLanguages = new Set(
		translations
			.filter((t) => t.status !== "failed")
			.map((t) => t.language),
	);
	const availableLanguages = Object.entries(SUPPORTED_LANGUAGES).filter(
		([code]) => !nonFailedLanguages.has(code),
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
				<div className="min-w-0 flex-1">
					<TranscriptionTitleEditor
						displayName={transcription.displayName}
						filename={transcription.filename}
						isPending={renameMutation.isPending}
						errorMessage={renameMutation.errorMessage}
						onSave={renameMutation.rename}
						onCancel={renameMutation.clearError}
						className="max-w-xl"
					/>
					<div className="flex items-center gap-2 mt-1">
						<Badge className={statusConfig[transcription.status].className}>
							{statusConfig[transcription.status].label}
						</Badge>
						{transcription.enableDiarization && (
							<Badge className="bg-violet-100 text-violet-800">
								<Users className="w-3 h-3 mr-1" />
								Speakers
							</Badge>
						)}
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
			{(transcription.preview || transcription.transcriptText || (transcription.diarizationData && transcription.diarizationData.length > 0)) && (
				<Card>
					<CardHeader className="flex flex-row items-center justify-between">
						<CardTitle className="text-lg flex items-center gap-2">
							{transcription.diarizationData && transcription.diarizationData.length > 0 ? (
								<>
									<Users className="w-5 h-5" />
									Speaker Transcript
								</>
							) : (
								"Transcript Preview"
							)}
						</CardTitle>
						<CopyButton contentRef={transcriptRef} />
					</CardHeader>
					<CardContent>
						<div ref={transcriptRef}>
							{viewingTranslation?.translatedText ? (
								<p className="text-stone-600 whitespace-pre-wrap">
									{viewingTranslation.translatedText}
								</p>
							) : transcription.diarizationData && transcription.diarizationData.length > 0 ? (
								<div className="space-y-4">
									{transcription.diarizationData.map((segment) => (
										<div key={`${segment.speaker}-${segment.start}-${segment.end}`}>
											<div className="flex items-center gap-2 mb-1">
												<span className="text-sm font-semibold text-stone-900">
													Speaker {segment.speaker}
												</span>
												<span className="text-xs text-stone-400">
													{formatTimestamp(segment.start)} – {formatTimestamp(segment.end)}
												</span>
											</div>
											<p className="text-stone-600 text-sm leading-relaxed">
												{segment.text}
											</p>
										</div>
									))}
								</div>
							) : (
								<p className="text-stone-600 whitespace-pre-wrap">
									{transcription.transcriptText ?? transcription.preview}
								</p>
							)}
						</div>
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
					<CardHeader className="flex flex-row items-center justify-between">
						<CardTitle className="text-lg">
							<div className="flex items-center gap-2">
								Summary
								{isFlexibleSummary(displayData.summaryData) && (
									<ContentTypeBadge contentType={displayData.summaryData.contentType} />
								)}
								{viewingTranslation && (
									<span className="text-sm font-normal text-stone-500">
										({displayData.label})
									</span>
								)}
							</div>
						</CardTitle>
						<CopyButton contentRef={summaryRef} />
					</CardHeader>
					<CardContent>
						<div ref={summaryRef}>
							<SummaryRenderer data={displayData.summaryData} idPrefix="detail" />
						</div>
					</CardContent>
				</Card>
			)}

			{isSignedIn && transcription.status === "completed" && (
				<TranscriptionChat transcriptionId={id} />
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
											{t.status === "failed" && (
												<Button
													variant="outline"
													size="sm"
													onClick={() =>
														translateMutation.mutate(t.language)
													}
													disabled={translateMutation.isPending}
												>
													{translateMutation.isPending ? (
														<Loader2 className="w-4 h-4 animate-spin mr-1" />
													) : (
														<RefreshCw className="w-4 h-4 mr-1" />
													)}
													Retry
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
