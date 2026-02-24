import { createHmac } from "node:crypto";

const TRIAL_ACTOR_COOKIE_NAME = "actor_id";

function getTrialCookieSecret(): string {
	const secret = process.env.TRIAL_COOKIE_SECRET;
	if (!secret) {
		throw new Error(
			"TRIAL_COOKIE_SECRET env var is required for e2e tests",
		);
	}
	return secret;
}

function signActorId(actorId: string): string {
	const secret = getTrialCookieSecret();
	const signature = createHmac("sha256", secret)
		.update(actorId)
		.digest("base64url");
	return `${actorId}.${signature}`;
}

export function createSignedActorCookie(): {
	actorId: string;
	cookieHeader: string;
} {
	const actorId = crypto.randomUUID();
	const signedValue = signActorId(actorId);
	const cookieHeader = `${TRIAL_ACTOR_COOKIE_NAME}=${signedValue}`;
	return { actorId, cookieHeader };
}
