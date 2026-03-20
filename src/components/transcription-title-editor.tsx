"use client";

import { Check, Pencil, X } from "lucide-react";
import { useState } from "react";
import { getTranscriptionTitle } from "@/components/transcription-title-utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface TranscriptionTitleEditorProps {
	displayName: string | null;
	filename: string;
	isPending?: boolean;
	errorMessage?: string | null;
	onSave: (nextDisplayName: string) => Promise<void> | void;
	onCancel?: () => void;
	className?: string;
}

export function getOriginalFilenameLabel(
	displayName: string | null,
	filename: string,
): string | null {
	const trimmedDisplayName = displayName?.trim();

	return getTranscriptionTitle(displayName, filename) === filename &&
		(!trimmedDisplayName || trimmedDisplayName === filename)
		? null
		: filename;
}

export function validateDisplayNameDraft(draft: string): string | null {
	return draft.trim() ? null : "Display name cannot be empty";
}

export function TranscriptionTitleEditor({
	displayName,
	filename,
	isPending = false,
	errorMessage = null,
	onSave,
	onCancel,
	className,
}: TranscriptionTitleEditorProps) {
	const resolvedTitle = getTranscriptionTitle(displayName, filename);
	const originalFilenameLabel = getOriginalFilenameLabel(displayName, filename);
	const [isEditing, setIsEditing] = useState(false);
	const [draft, setDraft] = useState(resolvedTitle);
	const [validationError, setValidationError] = useState<string | null>(null);

	async function handleSave() {
		const nextDisplayName = draft.trim();
		const nextValidationError = validateDisplayNameDraft(draft);

		if (nextValidationError) {
			setValidationError(nextValidationError);
			return;
		}

		setValidationError(null);
		await onSave(nextDisplayName);
		setIsEditing(false);
	}

	function handleCancel() {
		setDraft(resolvedTitle);
		setValidationError(null);
		setIsEditing(false);
		onCancel?.();
	}

	if (!isEditing) {
		return (
			<div className={cn("min-w-0", className)}>
				<div className="flex items-start gap-2">
					<div className="min-w-0 flex-1">
						<p className="font-medium text-stone-900 truncate">{resolvedTitle}</p>
						{originalFilenameLabel ? (
							<p className="text-xs text-stone-500 truncate">
								{originalFilenameLabel}
							</p>
						) : null}
					</div>
					<Button
						type="button"
						variant="ghost"
						size="icon"
						className="h-8 w-8 shrink-0"
						onClick={() => {
							setDraft(resolvedTitle);
							setValidationError(null);
							setIsEditing(true);
						}}
						aria-label={`Rename ${resolvedTitle}`}
					>
						<Pencil className="h-4 w-4" />
					</Button>
				</div>
				{errorMessage ? (
					<p className="mt-1 text-xs text-red-600">{errorMessage}</p>
				) : null}
			</div>
		);
	}

	return (
		<div className={cn("space-y-2", className)}>
			<div className="flex items-start gap-2">
				<Input
					value={draft}
					onChange={(event) => {
						setDraft(event.target.value);
						if (validationError) {
							setValidationError(null);
						}
					}}
					disabled={isPending}
					aria-label="Display name"
				/>
				<Button
					type="button"
					variant="outline"
					size="icon"
					className="h-9 w-9 shrink-0"
					onClick={() => void handleSave()}
					disabled={isPending}
					aria-label="Save display name"
				>
					<Check className="h-4 w-4" />
				</Button>
				<Button
					type="button"
					variant="ghost"
					size="icon"
					className="h-9 w-9 shrink-0"
					onClick={handleCancel}
					disabled={isPending}
					aria-label="Cancel rename"
				>
					<X className="h-4 w-4" />
				</Button>
			</div>
			{validationError ? (
				<p className="text-xs text-red-600">{validationError}</p>
			) : null}
			{!validationError && errorMessage ? (
				<p className="text-xs text-red-600">{errorMessage}</p>
			) : null}
		</div>
	);
}
