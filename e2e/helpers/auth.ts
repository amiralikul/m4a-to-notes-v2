import { randomUUID } from "node:crypto";
import { signActorId, TRIAL_ACTOR_COOKIE_NAME } from "@/lib/trial-identity";

export function createSignedActorCookie(): {
	actorId: string;
	cookieHeader: string;
} {
	const actorId = randomUUID();
	const signedValue = signActorId(actorId);
	const cookieHeader = `${TRIAL_ACTOR_COOKIE_NAME}=${signedValue}`;
	return { actorId, cookieHeader };
}
