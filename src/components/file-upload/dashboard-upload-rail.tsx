"use client";

import { CheckCircle2, FileAudio, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface DashboardUploadRailProps {
	isDragOver: boolean;
	onBrowseClick: () => void;
	formatsLabel: string;
	maxSizeLabel: string;
}

export function DashboardUploadRail({
	isDragOver,
	onBrowseClick,
	formatsLabel,
	maxSizeLabel,
}: DashboardUploadRailProps) {
	return (
		<Card
			className={cn(
				"overflow-hidden rounded-3xl border border-stone-200/80 bg-white/95 shadow-sm transition-all duration-200",
				isDragOver
					? "border-amber-400 bg-amber-50/70 shadow-md"
					: "hover:border-amber-300 hover:bg-stone-50/80",
			)}
		>
			<CardContent className="flex min-h-[5.5rem] flex-col gap-4 px-4 py-4 sm:px-5 lg:flex-row lg:items-center lg:justify-between">
				<div className="flex min-w-0 items-start gap-3">
					<div
						className={cn(
							"flex size-11 shrink-0 items-center justify-center rounded-2xl border border-stone-200 bg-stone-50 text-stone-600 transition-colors",
							isDragOver && "border-amber-300 bg-amber-100 text-amber-900",
						)}
					>
						<Upload className="size-5" />
					</div>
					<div className="min-w-0 space-y-1">
						<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-stone-500">
							Upload audio
						</p>
						<div className="space-y-1">
							<p className="text-base font-semibold text-stone-900">
								{isDragOver ? "Drop files to upload" : "Add a recording"}
							</p>
							<p className="text-sm leading-relaxed text-stone-600">
								{isDragOver
									? "Release to queue this file for transcription."
									: "Drag audio here or browse to add another file without leaving the workspace."}
							</p>
						</div>
					</div>
				</div>

				<div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between lg:justify-end">
					<div className="flex flex-wrap gap-2">
						<Badge
							variant="outline"
							className="rounded-full border-stone-200 bg-white px-3 py-1 text-xs text-stone-600"
						>
							<FileAudio className="mr-1.5 size-3" />
							{formatsLabel}
						</Badge>
						<Badge
							variant="outline"
							className="rounded-full border-stone-200 bg-white px-3 py-1 text-xs text-stone-600"
						>
							<CheckCircle2 className="mr-1.5 size-3" />
							{maxSizeLabel}
						</Badge>
					</div>

					<Button
						type="button"
						onClick={onBrowseClick}
						className="h-10 rounded-xl bg-stone-900 px-4 text-sm font-semibold text-stone-50 hover:bg-stone-800"
					>
						<Upload className="mr-2 size-4" />
						Upload files
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}
