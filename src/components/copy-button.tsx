"use client";

import { Check, Copy } from "lucide-react";
import type { RefObject } from "react";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";

interface CopyButtonProps {
	contentRef: RefObject<HTMLElement | null>;
	className?: string;
}

export function CopyButton({ contentRef, className }: CopyButtonProps) {
	const [copied, setCopied] = useState(false);

	const handleCopy = useCallback(async () => {
		const text = contentRef.current?.innerText;
		if (!text) return;
		await navigator.clipboard.writeText(text);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	}, [contentRef]);

	return (
		<Button
			variant="ghost"
			size="sm"
			onClick={handleCopy}
			className={className}
		>
			{copied ? (
				<Check className="w-4 h-4 text-emerald-600" />
			) : (
				<Copy className="w-4 h-4 text-stone-400" />
			)}
		</Button>
	);
}
