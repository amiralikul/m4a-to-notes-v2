import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { processTranscription } from "@/inngest/functions/process-transcription";

export const { GET, POST, PUT } = serve({
	client: inngest,
	functions: [processTranscription],
});
