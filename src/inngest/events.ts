import { EventSchemas } from "inngest";

export const INNGEST_EVENTS = {
	TRANSCRIPTION_REQUESTED: "audio/transcription.requested",
	TRANSCRIPTION_COMPLETED: "audio/transcription.completed",
	JOB_ANALYSIS_REQUESTED: "jobs/analysis.requested",
	TRANSLATION_REQUESTED: "audio/translation.requested",
} as const;

export const schemas = new EventSchemas().fromRecord<{
	[INNGEST_EVENTS.TRANSCRIPTION_REQUESTED]: {
		data: {
			transcriptionId: string;
		};
	};
	[INNGEST_EVENTS.TRANSCRIPTION_COMPLETED]: {
		data: {
			transcriptionId: string;
		};
	};
	[INNGEST_EVENTS.TRANSLATION_REQUESTED]: {
		data: {
			translationId: string;
			transcriptionId: string;
			language: string;
		};
	};
	[INNGEST_EVENTS.JOB_ANALYSIS_REQUESTED]: {
		data: {
			analysisId: string;
		};
	};
}>();
