"use client";

import { AlertCircle, FileText, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { DashboardTranscriptionDetail } from "@/components/dashboard/types";

interface TranscriptionTranscriptPanelProps {
	transcription: DashboardTranscriptionDetail;
}

function formatTimestamp(ms: number): string {
	const totalSeconds = Math.floor(ms / 1000);
	const minutes = Math.floor(totalSeconds / 60);
	const seconds = totalSeconds % 60;
	return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function TranscriptionTranscriptPanel({
	transcription,
}: TranscriptionTranscriptPanelProps) {
	const hasDiarization =
		!!transcription.diarizationData && transcription.diarizationData.length > 0;
	const transcriptText = transcription.transcriptText ?? transcription.preview;
	const hasTranscriptContent = !!transcriptText || hasDiarization;

	return (
		<div className="flex flex-col gap-4">
			<Card className="border-stone-200">
				<CardContent className="flex flex-col gap-4 p-6">
					<div className="flex items-center gap-2">
						{hasDiarization ? (
							<Users className="size-4 text-stone-600" />
						) : (
							<FileText className="size-4 text-stone-600" />
						)}
						<p className="text-base font-semibold text-stone-900">
							{hasDiarization ? "Speaker Transcript" : "Transcript Preview"}
						</p>
					</div>

					{transcription.error ? (
						<div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
							<AlertCircle className="mt-0.5 size-4 shrink-0" />
							<span>{transcription.error.message || "Transcript failed to load."}</span>
						</div>
					) : null}

					{hasTranscriptContent ? (
						hasDiarization ? (
							<div className="flex flex-col gap-4">
								{transcription.diarizationData?.map((segment) => (
									<div key={`${segment.speaker}-${segment.start}-${segment.end}`}>
										<div className="flex flex-wrap items-center gap-2">
											<span className="text-sm font-semibold text-stone-900">
												Speaker {segment.speaker}
											</span>
											<span className="text-xs text-stone-400">
												{formatTimestamp(segment.start)} -{" "}
												{formatTimestamp(segment.end)}
											</span>
										</div>
										<p className="mt-1 text-sm leading-relaxed text-stone-600">
											{segment.text}
										</p>
									</div>
								))}
							</div>
						) : (
							<p className="whitespace-pre-wrap text-sm leading-relaxed text-stone-600">
								{transcriptText}
							</p>
						)
					) : (
						<p className="text-sm text-stone-500">
							Transcript is not available for this transcription yet.
						</p>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
