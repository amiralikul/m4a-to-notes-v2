import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { processTranscription } from "@/inngest/functions/process-transcription";
import { processSummary } from "@/inngest/functions/process-summary";
import { processTranslation } from "@/inngest/functions/process-translation";

export const { GET, POST, PUT } = serve({
	client: inngest,
	functions: [processTranscription, processSummary, processTranslation],
});
