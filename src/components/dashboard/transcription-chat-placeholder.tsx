"use client";

import { MessageSquareText, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export function TranscriptionChatPlaceholder() {
	return (
		<Card className="border-stone-200">
			<CardContent className="flex flex-col gap-4 p-6">
				<div className="flex items-center gap-2">
					<MessageSquareText className="size-4 text-stone-600" />
					<p className="text-base font-semibold text-stone-900">Chat</p>
					<Badge variant="outline" className="bg-stone-50 text-stone-600">
						Preview
					</Badge>
				</div>

				<div className="rounded-2xl border border-dashed border-stone-200 bg-stone-50/70 p-6">
					<div className="flex items-start gap-3">
						<Sparkles className="mt-0.5 size-4 text-stone-400" />
						<div className="flex flex-col gap-1">
							<p className="text-sm font-medium text-stone-900">
								Chat is coming soon
							</p>
							<p className="text-sm leading-relaxed text-stone-500">
								This tab is reserved for a future conversational workspace and
								does not trigger any backend behavior yet.
							</p>
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
