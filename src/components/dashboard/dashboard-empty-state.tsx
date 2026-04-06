import { FileAudio, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";

export function DashboardEmptyState() {
	return (
		<Card className="border-stone-200 shadow-sm">
			<CardContent className="p-6">
				<Empty className="min-h-[32rem] border border-dashed border-stone-200 bg-stone-50/60">
					<EmptyHeader>
						<EmptyMedia variant="icon">
							<FileAudio />
						</EmptyMedia>
						<EmptyTitle>Your workspace is ready</EmptyTitle>
						<EmptyDescription>
							Upload an audio file to generate a transcript, summary, and
							follow-up workspace here.
						</EmptyDescription>
					</EmptyHeader>
					<EmptyContent>
						<div className="flex items-center gap-2 rounded-full border border-stone-200 bg-background px-3 py-2 text-sm text-stone-600">
							<Sparkles className="size-4 text-stone-400" />
							The newest transcription will open here automatically.
						</div>
					</EmptyContent>
				</Empty>
			</CardContent>
		</Card>
	);
}
