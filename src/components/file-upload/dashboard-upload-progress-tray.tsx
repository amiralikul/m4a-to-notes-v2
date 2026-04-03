"use client";

import {
	AlertCircle,
	CheckCircle2,
	FileAudio,
	Loader2,
	RotateCcw,
	X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export interface DashboardUploadProgressItem {
	id: string;
	filename: string;
	status: "uploading" | "processing" | "completed" | "error";
	progress: number;
	statusLabel: string;
	detail: string;
	error?: string;
	canRetry?: boolean;
	canRemove?: boolean;
}

interface DashboardUploadProgressTrayProps {
	items: DashboardUploadProgressItem[];
	onRetry: (id: string) => void;
	onRemove: (id: string) => void;
}

function getRowIcon(status: DashboardUploadProgressItem["status"]) {
	switch (status) {
		case "uploading":
		case "processing":
			return <Loader2 className="size-4 animate-spin text-amber-600" />;
		case "completed":
			return <CheckCircle2 className="size-4 text-emerald-600" />;
		case "error":
			return <AlertCircle className="size-4 text-red-600" />;
		default:
			return <FileAudio className="size-4 text-stone-500" />;
	}
}

export function DashboardUploadProgressTray({
	items,
	onRetry,
	onRemove,
}: DashboardUploadProgressTrayProps) {
	return (
		<Card className="overflow-hidden rounded-3xl border border-stone-200 shadow-sm">
			<CardContent className="p-0">
				<div className="flex items-center justify-between gap-3 border-b border-stone-200 px-4 py-3 sm:px-5">
					<div>
						<p className="text-sm font-semibold text-stone-900">Upload activity</p>
						<p className="text-xs text-stone-500">
							Current file progress and recovery actions
						</p>
					</div>
					<Badge
						variant="outline"
						className="rounded-full border-stone-200 bg-stone-50 px-2.5 py-1 text-xs text-stone-600"
					>
						{items.length} active
					</Badge>
				</div>

				<div className="divide-y divide-stone-200">
					{items.map((item) => (
						<div
							key={item.id}
							className="grid gap-3 px-4 py-3 sm:px-5 lg:grid-cols-[minmax(0,1fr)_12rem_auto] lg:items-center"
						>
							<div className="min-w-0 space-y-2">
								<div className="flex min-w-0 items-center gap-2">
									<span className="shrink-0">{getRowIcon(item.status)}</span>
									<p className="truncate text-sm font-medium text-stone-900">
										{item.filename}
									</p>
									<span
										className={cn(
											"shrink-0 text-xs font-medium",
											item.status === "error"
												? "text-red-600"
												: item.status === "completed"
													? "text-emerald-600"
													: "text-amber-700",
										)}
									>
										{item.statusLabel}
									</span>
								</div>
								<p
									className={cn(
										"line-clamp-2 text-xs leading-relaxed",
										item.error ? "text-red-600" : "text-stone-500",
									)}
								>
									{item.detail}
								</p>
							</div>

							<div className="space-y-2 lg:min-w-[12rem]">
								<Progress
									value={item.progress}
									className={cn(
										"h-1.5 bg-stone-200",
										item.status === "error" && "bg-red-100",
										item.status === "completed" && "bg-emerald-100",
									)}
								/>
								<p className="text-right text-xs tabular-nums text-stone-500">
									{Math.max(0, Math.min(100, item.progress))}%
								</p>
							</div>

							<div className="flex items-center justify-end gap-1">
								{item.canRetry ? (
									<Button
										type="button"
										variant="ghost"
										size="icon"
										className="size-8 rounded-full text-stone-500 hover:bg-stone-100 hover:text-stone-900"
										onClick={() => onRetry(item.id)}
										aria-label={`Retry ${item.filename}`}
									>
										<RotateCcw className="size-4" />
									</Button>
								) : null}
								{item.canRemove ? (
									<Button
										type="button"
										variant="ghost"
										size="icon"
										className="size-8 rounded-full text-stone-500 hover:bg-stone-100 hover:text-stone-900"
										onClick={() => onRemove(item.id)}
										aria-label={`Remove ${item.filename}`}
									>
										<X className="size-4" />
									</Button>
								) : null}
							</div>
						</div>
					))}
				</div>
			</CardContent>
		</Card>
	);
}
