import { Inngest } from "inngest";
import { schemas } from "./events";
import { logger } from "@/lib/logger";

export const inngest = new Inngest({
	id: "m4a-to-notes-v2",
	schemas,
	logger,
});
