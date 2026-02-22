"use client";

import { cn } from "@/lib/utils";

interface AudioPlayerProps {
	src: string;
	className?: string;
}

export function AudioPlayer({ src, className }: AudioPlayerProps) {
	return (
		<audio
			controls
			preload="none"
			src={src}
			className={cn("w-full h-10", className)}
		>
			Your browser does not support the audio element.
		</audio>
	);
}
