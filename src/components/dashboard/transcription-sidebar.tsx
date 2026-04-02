"use client";

import { FileAudio, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { getTranscriptionTitle } from "@/components/transcription-title-utils";
import { cn } from "@/lib/utils";
import {
	TRANSCRIPTION_SIDEBAR_SCROLL_CLASS,
	TRANSCRIPTION_SIDEBAR_SCROLL_CONTENT_CLASS,
} from "./layout-classes";
import { getSummaryStatusConfig, getTranscriptionStatusConfig } from "./status-config";
import type { DashboardTranscriptionItem } from "./types";

export interface TranscriptionSidebarProps {
	items: DashboardTranscriptionItem[];
	selectedId: string | null;
	onSelect: (id: string) => void;
	isLoading: boolean;
	error: Error | null;
	onRetry?: () => void;
}

function formatDateTime(value: string) {
	return new Date(value).toLocaleString(undefined, {
		month: "short",
		day: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
}

function SidebarSkeleton() {
	return (
		<div className="flex flex-col gap-2 p-3">
			{Array.from({ length: 5 }).map((_, index) => (
				<div
					key={`sidebar-skeleton-${index}`}
					className="flex flex-col gap-3 rounded-2xl border border-stone-200 p-3"
				>
					<div className="flex items-center justify-between gap-3">
						<Skeleton className="h-4 w-28" />
						<Skeleton className="h-4 w-14" />
					</div>
					<Skeleton className="h-3 w-full" />
					<Skeleton className="h-3 w-4/5" />
				</div>
			))}
		</div>
	);
}

function SidebarErrorState({
	message,
	onRetry,
}: {
	message: string;
	onRetry?: () => void;
}) {
	return (
		<Empty className="min-h-[20rem] border-none p-0">
			<EmptyHeader>
				<EmptyMedia variant="icon">
					<FileAudio />
				</EmptyMedia>
				<EmptyTitle>Couldn&apos;t load transcriptions</EmptyTitle>
				<EmptyDescription>{message}</EmptyDescription>
			</EmptyHeader>
			{onRetry ? (
				<EmptyContent>
					<Button type="button" variant="outline" onClick={onRetry}>
						<RefreshCw data-icon="inline-start" />
						Retry
					</Button>
				</EmptyContent>
			) : null}
		</Empty>
	);
}

function SidebarEmptyState() {
	return (
		<Empty className="min-h-[20rem] border-none p-0">
			<EmptyHeader>
				<EmptyMedia variant="icon">
					<FileAudio />
				</EmptyMedia>
				<EmptyTitle>No transcriptions yet</EmptyTitle>
				<EmptyDescription>
					Upload an audio file to start building your transcript workspace.
				</EmptyDescription>
			</EmptyHeader>
		</Empty>
	);
}

export function TranscriptionSidebar({
	items,
	selectedId,
	onSelect,
	isLoading,
	error,
	onRetry,
}: TranscriptionSidebarProps) {
	return (
		<Card className="overflow-hidden border-stone-200 shadow-sm">
			<CardHeader className="gap-1 border-b">
				<CardTitle className="text-base font-semibold">Transcriptions</CardTitle>
				<CardDescription>
					{items.length > 0
						? `${items.length} recent item${items.length === 1 ? "" : "s"}`
						: "Recent uploads and summaries"}
				</CardDescription>
			</CardHeader>
			<CardContent className="p-0">
				{error ? (
					<div className="p-4">
						<SidebarErrorState message={error.message} onRetry={onRetry} />
					</div>
				) : isLoading ? (
					<SidebarSkeleton />
				) : items.length === 0 ? (
					<div className="p-4">
						<SidebarEmptyState />
					</div>
				) : (
					<ScrollArea className={TRANSCRIPTION_SIDEBAR_SCROLL_CLASS}>
						<div className={TRANSCRIPTION_SIDEBAR_SCROLL_CONTENT_CLASS}>
							{items.map((item) => {
								const isSelected = item.id === selectedId;
								const status = getTranscriptionStatusConfig(item.status);
								const summaryStatus = getSummaryStatusConfig(item.summaryStatus);
								const resolvedTitle = getTranscriptionTitle(
									item.displayName ?? null,
									item.filename,
								);

								return (
									<button
										key={item.id}
										type="button"
										onClick={() => onSelect(item.id)}
										aria-pressed={isSelected}
										className={cn(
											"flex w-full min-w-0 flex-col gap-3 rounded-2xl border p-3 text-left transition-colors",
											isSelected
												? "border-stone-900 bg-stone-900 text-stone-50"
												: "border-stone-200 bg-background hover:bg-stone-50",
										)}
									>
										<div className="flex items-start justify-between gap-3">
											<div className="min-w-0 flex-1">
												<p className="truncate text-sm font-medium">
													{resolvedTitle}
												</p>
												{item.displayName ? (
													<p
														className={cn(
															"truncate text-xs",
															isSelected ? "text-stone-300" : "text-stone-500",
														)}
													>
														{item.filename}
													</p>
												) : null}
											</div>
											<time
												dateTime={item.createdAt}
												className={cn(
													"shrink-0 text-xs",
													isSelected ? "text-stone-300" : "text-stone-500",
												)}
											>
												{formatDateTime(item.createdAt)}
											</time>
										</div>

										<div className="flex flex-wrap items-center gap-2">
											<Badge className={status.className}>{status.label}</Badge>
											{item.summaryStatus ? (
												<Badge variant="outline" className={summaryStatus.className}>
													{summaryStatus.label}
												</Badge>
											) : null}
											{item.translationCount > 0 ? (
												<span
													className={cn(
														"text-xs",
														isSelected ? "text-stone-300" : "text-stone-500",
													)}
												>
													{item.translationCount} translation
													{item.translationCount === 1 ? "" : "s"}
												</span>
											) : null}
										</div>

										{item.preview ? (
											<p
												className={cn(
													"line-clamp-2 text-sm leading-relaxed",
													isSelected ? "text-stone-200" : "text-stone-600",
												)}
											>
												{item.preview}
											</p>
										) : null}
									</button>
								);
							})}
						</div>
					</ScrollArea>
				)}
			</CardContent>
		</Card>
	);
}
