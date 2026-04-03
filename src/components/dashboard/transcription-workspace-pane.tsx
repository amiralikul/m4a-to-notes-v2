"use client";

import { AudioLines, FileText, Trash2, Users } from "lucide-react";
import { AudioPlayer } from "@/components/audio-player";
import { TranscriptionTitleEditor } from "@/components/transcription-title-editor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	getSummaryStatusConfig,
	getTranscriptionStatusConfig,
} from "@/components/dashboard/status-config";
import { TranscriptionChatPlaceholder } from "@/components/dashboard/transcription-chat-placeholder";
import { TranscriptionSummaryPanel } from "@/components/dashboard/transcription-summary-panel";
import { TranscriptionTranscriptPanel } from "@/components/dashboard/transcription-transcript-panel";
import type {
	DashboardSummaryPayload,
	DashboardTranscriptionDetail,
	DashboardTranslationItem,
	WorkspaceTab,
	DashboardLanguageOption,
} from "@/components/dashboard/types";

export interface TranscriptionWorkspacePaneProps {
	activeTab: WorkspaceTab;
	onTabChange: (tab: WorkspaceTab) => void;
	transcription: DashboardTranscriptionDetail;
	summary: DashboardSummaryPayload | null;
	translations?: DashboardTranslationItem[];
	availableLanguages?: DashboardLanguageOption[];
	selectedLanguage?: string;
	viewingTranslationId?: string | null;
	audioSrc?: string;
	transcriptDownloadHref?: string;
	audioDownloadHref?: string;
	onDeleteTranscription?: () => void;
	onRenameTranscription?: (nextDisplayName: string) => Promise<void> | void;
	renameIsPending?: boolean;
	renameErrorMessage?: string | null;
	onRenameErrorDismiss?: () => void;
	onSelectedLanguageChange?: (language: string) => void;
	onRequestTranslation?: (language: string) => void;
	onToggleViewingTranslation?: (translationId: string) => void;
	onDeleteTranslation?: (language: string) => void;
}

function formatDateTime(value: string): string {
	return new Date(value).toLocaleDateString(undefined, {
		year: "numeric",
		month: "short",
		day: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
}

function WorkspaceHeader({
	transcription,
	transcriptDownloadHref,
	audioDownloadHref,
	onDeleteTranscription,
	onRenameTranscription,
	renameIsPending,
	renameErrorMessage,
	onRenameErrorDismiss,
}: Pick<
	TranscriptionWorkspacePaneProps,
	| "transcription"
	| "transcriptDownloadHref"
	| "audioDownloadHref"
	| "onDeleteTranscription"
	| "onRenameTranscription"
	| "renameIsPending"
	| "renameErrorMessage"
	| "onRenameErrorDismiss"
>) {
	const transcriptionStatus = getTranscriptionStatusConfig(transcription.status);
	const summaryStatus = getSummaryStatusConfig(transcription.summaryStatus);

	return (
		<CardHeader className="gap-4 pb-0">
			<div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
				<div className="flex min-w-0 flex-col gap-3">
					<div className="flex flex-wrap items-center gap-2">
						<div className="min-w-0">
							{onRenameTranscription ? (
								<TranscriptionTitleEditor
									displayName={transcription.displayName ?? null}
									filename={transcription.filename}
									isPending={renameIsPending}
									errorMessage={renameErrorMessage}
									onSave={onRenameTranscription}
									onCancel={onRenameErrorDismiss}
								/>
							) : (
								<CardTitle className="text-2xl font-semibold tracking-tight text-stone-900">
									{transcription.displayName ?? transcription.filename}
								</CardTitle>
							)}
						</div>
						<Badge className={transcriptionStatus.className}>
							{transcriptionStatus.label}
						</Badge>
						{transcription.enableDiarization ? (
							<Badge variant="outline" className="bg-violet-50 text-violet-700">
								<Users className="size-3" />
								Speakers
							</Badge>
						) : null}
						{transcription.summaryStatus ? (
							<Badge className={summaryStatus.className}>
								{summaryStatus.label}
							</Badge>
						) : null}
					</div>
					<p className="text-sm text-stone-500">
						{formatDateTime(transcription.createdAt)}
					</p>
				</div>

				<div className="flex flex-wrap items-center gap-2">
					{transcriptDownloadHref ? (
						<Button asChild variant="outline" size="sm">
							<a href={transcriptDownloadHref}>
								<FileText className="size-4" />
								Download transcript
							</a>
						</Button>
					) : null}
					{audioDownloadHref ? (
						<Button asChild variant="outline" size="sm">
							<a href={audioDownloadHref}>
								<AudioLines className="size-4" />
								Open audio
							</a>
						</Button>
					) : null}
					{onDeleteTranscription ? (
						<Button
							type="button"
							variant="outline"
							size="sm"
							className="text-red-600 hover:text-red-700 hover:bg-red-50"
							onClick={onDeleteTranscription}
						>
							<Trash2 className="size-4" />
							Delete transcription
						</Button>
					) : null}
				</div>
			</div>
		</CardHeader>
	);
}

export function TranscriptionWorkspacePane({
	activeTab,
	onTabChange,
	transcription,
	summary,
	translations = [],
	availableLanguages = [],
	selectedLanguage = "",
	viewingTranslationId = null,
	audioSrc,
	transcriptDownloadHref,
	audioDownloadHref,
	onDeleteTranscription,
	onRenameTranscription,
	renameIsPending = false,
	renameErrorMessage = null,
	onRenameErrorDismiss,
	onSelectedLanguageChange,
	onRequestTranslation,
	onToggleViewingTranslation,
	onDeleteTranslation,
}: TranscriptionWorkspacePaneProps) {
	const resolvedAudioSrc = audioSrc ?? transcription.audioKey;
	const viewingTranslation =
		translations.find((translation) => translation.id === viewingTranslationId) ??
		null;

	return (
		<Card className="overflow-hidden border-stone-200 shadow-sm">
			<WorkspaceHeader
				transcription={transcription}
				transcriptDownloadHref={transcriptDownloadHref}
				audioDownloadHref={audioDownloadHref}
				onDeleteTranscription={onDeleteTranscription}
				onRenameTranscription={onRenameTranscription}
				renameIsPending={renameIsPending}
				renameErrorMessage={renameErrorMessage}
				onRenameErrorDismiss={onRenameErrorDismiss}
			/>
			<Separator />
			<CardContent className="flex flex-col gap-5 p-6">
				<Tabs
					value={activeTab}
					onValueChange={(value) => onTabChange(value as WorkspaceTab)}
					className="flex flex-col gap-5"
				>
					<TabsList className="grid w-full grid-cols-3">
						<TabsTrigger value="summary" className="cursor-pointer">Summary</TabsTrigger>
						<TabsTrigger value="transcript" className="cursor-pointer">Transcript</TabsTrigger>
						<TabsTrigger value="chat" className="cursor-pointer">Chat</TabsTrigger>
					</TabsList>

					<AudioPlayer src={resolvedAudioSrc} />

					<TabsContent value="summary" className="mt-0 outline-none">
						<TranscriptionSummaryPanel
							summaryData={summary?.summaryData ?? null}
							summaryStatus={summary?.summaryStatus ?? transcription.summaryStatus}
							summaryError={summary?.summaryError ?? transcription.summaryError ?? null}
							translations={translations}
							availableLanguages={availableLanguages}
							selectedLanguage={selectedLanguage}
							viewingTranslationId={viewingTranslationId}
							onSelectedLanguageChange={onSelectedLanguageChange}
							onRequestTranslation={onRequestTranslation}
							onToggleViewingTranslation={onToggleViewingTranslation}
							onDeleteTranslation={onDeleteTranslation}
						/>
					</TabsContent>

					<TabsContent value="transcript" className="mt-0 outline-none">
						<TranscriptionTranscriptPanel
							transcription={transcription}
							viewingTranslation={viewingTranslation}
						/>
					</TabsContent>

					<TabsContent value="chat" className="mt-0 outline-none">
						<TranscriptionChatPlaceholder />
					</TabsContent>
				</Tabs>
			</CardContent>
		</Card>
	);
}
