"use client";

import { Languages, Loader2, RefreshCw, Trash2 } from "lucide-react";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SUPPORTED_LANGUAGES } from "@/lib/constants/languages";
import type { LanguageCode } from "@/lib/constants/languages";
import type {
	DashboardLanguageOption,
	DashboardTranslationItem,
} from "@/components/dashboard/types";
import { getTranscriptionStatusConfig } from "@/components/dashboard/status-config";

export interface TranscriptionTranslationsPanelProps {
	translations: DashboardTranslationItem[];
	availableLanguages?: DashboardLanguageOption[];
	selectedLanguage?: string;
	viewingTranslationId?: string | null;
	onSelectedLanguageChange?: (language: string) => void;
	onRequestTranslation?: (language: string) => void;
	onToggleViewingTranslation?: (translationId: string) => void;
	onDeleteTranslation?: (language: string) => void;
}

export function TranscriptionTranslationsPanel({
	translations,
	availableLanguages = [],
	selectedLanguage = "",
	viewingTranslationId = null,
	onSelectedLanguageChange,
	onRequestTranslation,
	onToggleViewingTranslation,
	onDeleteTranslation,
}: TranscriptionTranslationsPanelProps) {
	const canRequestTranslation = availableLanguages.length > 0;

	return (
		<Card className="border-stone-200">
			<CardHeader className="gap-2 pb-0">
				<CardTitle className="flex items-center gap-2 text-base font-semibold text-stone-900">
					<Languages className="size-4" />
					Translations
				</CardTitle>
			</CardHeader>
			<CardContent className="flex flex-col gap-4 pt-4">
				<div className="flex flex-wrap items-end gap-3">
					<Select
						value={selectedLanguage}
						onValueChange={onSelectedLanguageChange}
						disabled={!canRequestTranslation || !onSelectedLanguageChange}
					>
						<SelectTrigger className="w-[200px]">
							<SelectValue placeholder="Select language" />
						</SelectTrigger>
						<SelectContent>
							<SelectGroup>
								{availableLanguages.map(([code, label]) => (
									<SelectItem key={code} value={code}>
										{label}
									</SelectItem>
								))}
							</SelectGroup>
						</SelectContent>
					</Select>
					<Button
						type="button"
						size="sm"
						disabled={
							!selectedLanguage ||
							!onRequestTranslation ||
							!canRequestTranslation
						}
						onClick={() => onRequestTranslation?.(selectedLanguage)}
					>
						<Languages className="size-4" />
						Translate
					</Button>
				</div>

				{translations.length > 0 ? (
					<div className="flex flex-col gap-2">
						<p className="text-sm font-medium text-stone-700">Translation history</p>
						<div className="flex flex-col gap-2">
							{translations.map((translation) => {
								const status = getTranscriptionStatusConfig(translation.status);
								const languageLabel =
									SUPPORTED_LANGUAGES[
										translation.language as LanguageCode
									] ?? translation.language;
								const isViewing = viewingTranslationId === translation.id;
								return (
									<div
										key={translation.id}
										className="flex flex-col gap-3 rounded-lg border border-stone-200 p-3 sm:flex-row sm:items-center sm:justify-between"
									>
										<div className="flex items-center gap-3">
											<span className="text-sm font-medium text-stone-900">
												{languageLabel}
											</span>
											<Badge className={status.className}>{status.label}</Badge>
											{translation.status === "processing" ||
											translation.status === "pending" ? (
												<Loader2 className="size-4 animate-spin text-stone-400" />
											) : null}
										</div>
										<div className="flex flex-wrap items-center gap-2">
											{translation.status === "completed" ? (
												<Button
													type="button"
													variant="outline"
													size="sm"
													onClick={() =>
														onToggleViewingTranslation?.(translation.id)
													}
												>
													{isViewing ? "Show Original" : "View"}
												</Button>
											) : null}
											{translation.status === "failed" ? (
												<Button
													type="button"
													variant="outline"
													size="sm"
													onClick={() =>
														onRequestTranslation?.(translation.language)
													}
													disabled={!onRequestTranslation}
												>
													<RefreshCw className="size-4" />
													Retry
												</Button>
											) : null}
											<Button
												type="button"
												variant="outline"
												size="sm"
												className="text-red-600 hover:text-red-700 hover:bg-red-50"
												onClick={() => onDeleteTranslation?.(translation.language)}
												disabled={!onDeleteTranslation}
											>
												<Trash2 className="size-4" />
												Delete
											</Button>
										</div>
									</div>
								);
							})}
						</div>
					</div>
				) : canRequestTranslation ? (
					<p className="text-sm text-stone-500">
						Choose a language to request a new translation.
					</p>
				) : (
					<p className="text-sm text-stone-500">
						All supported languages have already been translated.
					</p>
				)}
			</CardContent>
		</Card>
	);
}
