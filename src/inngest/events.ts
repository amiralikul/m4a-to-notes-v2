import { EventSchemas } from "inngest";

export const INNGEST_EVENTS = {
	TRANSCRIPTION_REQUESTED: "audio/transcription.requested",
	TRANSCRIPTION_COMPLETED: "audio/transcription.completed",
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
}>();
