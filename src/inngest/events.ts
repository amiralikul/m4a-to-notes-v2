import { EventSchemas } from "inngest";

export const INNGEST_EVENTS = {
	TRANSCRIPTION_REQUESTED: "audio/transcription.requested",
} as const;

export const schemas = new EventSchemas().fromRecord<{
	[INNGEST_EVENTS.TRANSCRIPTION_REQUESTED]: {
		data: {
			transcriptionId: string;
		};
	};
}>();
