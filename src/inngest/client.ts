import { Inngest } from "inngest";
import { schemas } from "./events";

export const inngest = new Inngest({
	id: "m4a-to-notes-v2",
	schemas,
});
