import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { TranscriptionWorkspacePane } from "../transcription-workspace-pane";

vi.mock("@/components/audio-player", () => ({
	AudioPlayer: ({ src }: { src: string }) => <div data-audio={src}>audio</div>,
}));

const completedTranscription = {
	id: "tr_1",
	transcriptionId: "tr_1",
	status: "completed" as const,
	progress: 100,
	filename: "Quarterly Review.m4a",
	createdAt: "2026-03-31T10:00:00.000Z",
	completedAt: "2026-03-31T10:12:00.000Z",
	preview: "Transcript preview",
	enableDiarization: true,
	diarizationData: [
		{
			speaker: "1",
			text: "We should ship the dashboard redesign this week.",
			start: 0,
			end: 4500,
		},
	],
	transcriptText: "We should ship the dashboard redesign this week.",
	summaryStatus: "completed" as const,
	summaryUpdatedAt: "2026-03-31T10:13:00.000Z",
	error: null,
	summaryError: null,
	audioKey: "https://example.com/audio.m4a",
	translationCount: 1,
};

const completedSummary = {
	transcriptionId: "tr_1",
	summaryStatus: "completed" as const,
	summaryData: {
		contentType: "meeting",
		summary: "Overview of the weekly product review.",
		sections: [
			{
				key: "decisions",
				label: "Decisions",
				items: ["Ship the unified dashboard workspace this week."],
			},
		],
	},
	summaryError: null,
	summaryProvider: "openai",
	summaryModel: "gpt-5.4",
	summaryUpdatedAt: "2026-03-31T10:13:00.000Z",
};

const completedTranslation = {
	id: "translation_es",
	transcriptionId: "tr_1",
	language: "es",
	status: "completed" as const,
	translatedText: "Debemos enviar el rediseño del panel esta semana.",
	translatedSummary: {
		contentType: "meeting",
		summary: "Resumen de la revisión semanal del producto.",
		sections: [
			{
				key: "decisions",
				label: "Decisiones",
				items: ["Enviar el espacio de trabajo unificado esta semana."],
			},
		],
	},
	errorDetails: null,
	createdAt: "2026-03-31T10:20:00.000Z",
	completedAt: "2026-03-31T10:22:00.000Z",
};

describe("TranscriptionWorkspacePane", () => {
	it("renders summary content when the active tab is summary", () => {
		const html = renderToStaticMarkup(
			<TranscriptionWorkspacePane
				activeTab="summary"
				audioSrc="/audio/quarterly-review.m4a"
				availableLanguages={[
					["fr", "French"],
					["de", "German"],
				]}
				selectedLanguage="fr"
				viewingTranslationId={null}
				onTabChange={() => {}}
				onSelectedLanguageChange={() => {}}
				onRequestTranslation={() => {}}
				onToggleViewingTranslation={() => {}}
				onDeleteTranslation={() => {}}
				transcription={completedTranscription}
				summary={completedSummary}
				translations={[completedTranslation]}
				transcriptDownloadHref="/api/transcriptions/tr_1/transcript"
				audioDownloadHref="/api/transcriptions/tr_1/audio"
			/>,
		);

		expect(html).toContain("Summary");
		expect(html).toContain("Overview");
		expect(html).toContain("Overview of the weekly product review.");
	});

	it("renders transcript content when the active tab is transcript", () => {
		const html = renderToStaticMarkup(
			<TranscriptionWorkspacePane
				activeTab="transcript"
				audioSrc="/audio/quarterly-review.m4a"
				availableLanguages={[]}
				selectedLanguage=""
				viewingTranslationId={null}
				onTabChange={() => {}}
				onSelectedLanguageChange={() => {}}
				onRequestTranslation={() => {}}
				onToggleViewingTranslation={() => {}}
				onDeleteTranslation={() => {}}
				transcription={completedTranscription}
				summary={completedSummary}
				translations={[completedTranslation]}
				transcriptDownloadHref="/api/transcriptions/tr_1/transcript"
			/>,
		);

		expect(html).toContain("Speaker 1");
		expect(html).toContain("We should ship the dashboard redesign this week.");
	});

	it("renders the placeholder when the active tab is chat", () => {
		const html = renderToStaticMarkup(
			<TranscriptionWorkspacePane
				activeTab="chat"
				audioSrc="/audio/quarterly-review.m4a"
				availableLanguages={[]}
				selectedLanguage=""
				viewingTranslationId={null}
				onTabChange={() => {}}
				onSelectedLanguageChange={() => {}}
				onRequestTranslation={() => {}}
				onToggleViewingTranslation={() => {}}
				onDeleteTranslation={() => {}}
				transcription={completedTranscription}
				summary={completedSummary}
				translations={[completedTranslation]}
				transcriptDownloadHref="/api/transcriptions/tr_1/transcript"
			/>,
		);

		expect(html).toContain("Chat is coming soon");
	});

	it("renders translation controls inside the summary workspace", () => {
		const html = renderToStaticMarkup(
			<TranscriptionWorkspacePane
				activeTab="summary"
				audioSrc="/audio/quarterly-review.m4a"
				availableLanguages={[
					["fr", "French"],
				]}
				selectedLanguage="fr"
				viewingTranslationId={null}
				onTabChange={() => {}}
				onSelectedLanguageChange={() => {}}
				onRequestTranslation={() => {}}
				onToggleViewingTranslation={() => {}}
				onDeleteTranslation={() => {}}
				transcription={completedTranscription}
				summary={completedSummary}
				translations={[completedTranslation]}
				transcriptDownloadHref="/api/transcriptions/tr_1/transcript"
			/>,
		);

		expect(html).toContain("Translations");
		expect(html).toContain("Spanish");
		expect(html).toContain("View");
	});

	it("renders the translated summary when a translation is being viewed", () => {
		const html = renderToStaticMarkup(
			<TranscriptionWorkspacePane
				activeTab="summary"
				onTabChange={() => {}}
				transcription={completedTranscription}
				summary={completedSummary}
				translations={[completedTranslation]}
				viewingTranslationId="translation_es"
			/>,
		);

		expect(html).toContain("Resumen de la revisión semanal del producto.");
		expect(html).toContain("Show Original");
	});
});
