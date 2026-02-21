import { inngest } from "@/inngest/client";
import { INNGEST_EVENTS } from "@/inngest/events";
import type { Logger } from "@/lib/logger";

export class WorkflowService {
	constructor(private logger: Logger) {}

	async startTranscription(transcriptionId: string) {
		await inngest.send({
			name: INNGEST_EVENTS.TRANSCRIPTION_REQUESTED,
			data: { transcriptionId },
		});
		this.logger.info("Workflow: transcription requested", {
			transcriptionId,
		});
	}

	async regenerateSummary(transcriptionId: string) {
		await inngest.send({
			name: INNGEST_EVENTS.TRANSCRIPTION_COMPLETED,
			data: { transcriptionId },
		});
		this.logger.info("Workflow: summary regeneration requested", {
			transcriptionId,
		});
	}

	async requestTranslation(
		translationId: string,
		transcriptionId: string,
		language: string,
	) {
		await inngest.send({
			name: INNGEST_EVENTS.TRANSLATION_REQUESTED,
			data: { translationId, transcriptionId, language },
		});
		this.logger.info("Workflow: translation requested", {
			translationId,
			transcriptionId,
			language,
		});
	}
}
