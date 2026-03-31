"use client";

import { AlertCircle, Loader2 } from "lucide-react";
import { isFlexibleSummary } from "@/db/schema";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { SummaryRenderer, ContentTypeBadge } from "@/components/summary-renderer";
import { SUPPORTED_LANGUAGES } from "@/lib/constants/languages";
import type { LanguageCode } from "@/lib/constants/languages";
import type {
	DashboardLanguageOption,
	DashboardStatusMessage,
	DashboardTranscriptionStatus,
	DashboardTranslationItem,
} from "@/components/dashboard/types";
import { getSummaryStatusConfig } from "@/components/dashboard/status-config";
import { TranscriptionTranslationsPanel } from "@/components/dashboard/transcription-translations-panel";
import type { TranscriptionSummaryData } from "@/db/schema";

export interface TranscriptionSummaryPanelProps {
	summaryData: TranscriptionSummaryData | null;
	summaryStatus: DashboardTranscriptionStatus | null;
	summaryError?: DashboardStatusMessage | null;
	translations?: DashboardTranslationItem[];
	availableLanguages?: DashboardLanguageOption[];
	selectedLanguage?: string;
	viewingTranslationId?: string | null;
	onSelectedLanguageChange?: (language: string) => void;
	onRequestTranslation?: (language: string) => void;
	onToggleViewingTranslation?: (translationId: string) => void;
	onDeleteTranslation?: (language: string) => void;
}

function SummaryStateMessage({
	summaryStatus,
	summaryError,
	summaryData,
}: {
	summaryStatus: DashboardTranscriptionStatus | null;
	summaryError?: DashboardStatusMessage | null;
	summaryData: TranscriptionSummaryData | null;
}) {
	if (summaryError) {
		return (
			<div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
				<AlertCircle className="mt-0.5 size-4 shrink-0" />
				<span>{summaryError.message || "Summary failed to load."}</span>
			</div>
		);
	}

	if (summaryStatus === "pending" || summaryStatus === "processing") {
		return (
			<div className="flex items-center gap-2 rounded-lg border border-stone-200 bg-stone-50 p-3 text-sm text-stone-600">
				<Loader2 className="size-4 animate-spin" />
				<span>
					{summaryStatus === "pending"
						? "Summary is queued and will appear here when ready."
						: "Summary is still generating."}
				</span>
			</div>
		);
	}

	if (!summaryData) {
		return (
			<div className="rounded-lg border border-stone-200 bg-stone-50 p-3 text-sm text-stone-600">
				Summary is not available for this transcription yet.
			</div>
		);
	}

	return null;
}

export function TranscriptionSummaryPanel({
	summaryData,
	summaryStatus,
	summaryError,
	translations = [],
	availableLanguages = [],
	selectedLanguage = "",
	viewingTranslationId = null,
	onSelectedLanguageChange,
	onRequestTranslation,
	onToggleViewingTranslation,
	onDeleteTranslation,
}: TranscriptionSummaryPanelProps) {
	const status = getSummaryStatusConfig(summaryStatus);
	const viewingTranslation =
		translations.find((translation) => translation.id === viewingTranslationId) ??
		null;
	const displayedSummaryData =
		viewingTranslation?.translatedSummary ?? summaryData;
	const viewingTranslationLabel = viewingTranslation
		? SUPPORTED_LANGUAGES[viewingTranslation.language as LanguageCode] ??
			viewingTranslation.language
		: null;

	return (
		<div className="flex flex-col gap-4">
			<Card className="border-stone-200">
				<CardHeader className="gap-2 pb-0">
					<CardTitle className="flex flex-wrap items-center gap-2 text-base font-semibold text-stone-900">
						<span>Summary</span>
						<Badge className={status.className}>{status.label}</Badge>
						{displayedSummaryData && isFlexibleSummary(displayedSummaryData) ? (
							<ContentTypeBadge contentType={displayedSummaryData.contentType} />
						) : null}
						{viewingTranslationLabel ? (
							<span className="text-sm font-normal text-stone-500">
								({viewingTranslationLabel})
							</span>
						) : null}
					</CardTitle>
				</CardHeader>
				<CardContent className="flex flex-col gap-4 pt-4">
					<SummaryStateMessage
						summaryData={displayedSummaryData}
						summaryStatus={summaryStatus}
						summaryError={summaryError}
					/>
					{displayedSummaryData ? (
						<SummaryRenderer
							data={displayedSummaryData}
							idPrefix="dashboard-summary"
						/>
					) : null}
				</CardContent>
			</Card>

			{translations.length > 0 ||
			availableLanguages.length > 0 ||
			onRequestTranslation ? (
				<>
					<Separator />
					<TranscriptionTranslationsPanel
						translations={translations}
						availableLanguages={availableLanguages}
						selectedLanguage={selectedLanguage}
						viewingTranslationId={viewingTranslationId}
						onSelectedLanguageChange={onSelectedLanguageChange}
						onRequestTranslation={onRequestTranslation}
						onToggleViewingTranslation={onToggleViewingTranslation}
						onDeleteTranslation={onDeleteTranslation}
					/>
				</>
			) : null}
		</div>
	);
}
