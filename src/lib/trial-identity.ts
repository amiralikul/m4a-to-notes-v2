import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const TRIAL_ACTOR_COOKIE_NAME = "actor_id";
export const TRIAL_DAILY_LIMIT = 3;
export const TRIAL_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365 * 5;

export interface TrialCookieStore {
	get(name: string): { value: string } | undefined;
	set(
		name: string,
		value: string,
		options: {
			httpOnly: boolean;
			secure: boolean;
			sameSite: "lax";
			path: string;
			maxAge: number;
		},
	): void;
}

export interface ActorIdentity {
	actorId: string;
}

function getTrialCookieSecret(): string {
	const secret = process.env.TRIAL_COOKIE_SECRET;
	if (!secret) {
		throw new Error("TRIAL_COOKIE_SECRET is not set");
	}
	return secret;
}

function isValidActorId(value: string): boolean {
	return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
		value,
	);
}

function createActorSignature(actorId: string, secret: string): string {
	return createHmac("sha256", secret).update(actorId).digest("base64url");
}

export function signActorId(
	actorId: string,
	secret = getTrialCookieSecret(),
): string {
	return `${actorId}.${createActorSignature(actorId, secret)}`;
}

export function verifySignedActorId(
	signedValue: string | undefined,
	secret = getTrialCookieSecret(),
): string | null {
	if (!signedValue) {
		return null;
	}

	const separatorIndex = signedValue.lastIndexOf(".");
	if (separatorIndex <= 0 || separatorIndex >= signedValue.length - 1) {
		return null;
	}

	const actorId = signedValue.slice(0, separatorIndex);
	const signature = signedValue.slice(separatorIndex + 1);

	if (!isValidActorId(actorId)) {
		return null;
	}

	const expectedSignature = createActorSignature(actorId, secret);
	const actualBuffer = Buffer.from(signature);
	const expectedBuffer = Buffer.from(expectedSignature);

	if (actualBuffer.length !== expectedBuffer.length) {
		return null;
	}

	if (!timingSafeEqual(actualBuffer, expectedBuffer)) {
		return null;
	}

	return actorId;
}

function setActorCookie(store: TrialCookieStore, actorId: string): void {
	store.set(TRIAL_ACTOR_COOKIE_NAME, signActorId(actorId), {
		httpOnly: true,
		secure: true,
		sameSite: "lax",
		path: "/",
		maxAge: TRIAL_COOKIE_MAX_AGE_SECONDS,
	});
}

export async function resolveActorIdentity(
	cookieStore?: TrialCookieStore,
): Promise<ActorIdentity> {
	const store = cookieStore ?? ((await cookies()) as TrialCookieStore);
	const currentSigned = store.get(TRIAL_ACTOR_COOKIE_NAME)?.value;
	const verifiedActorId = verifySignedActorId(currentSigned);

	if (verifiedActorId) {
		return { actorId: verifiedActorId };
	}

	const actorId = crypto.randomUUID();
	setActorCookie(store, actorId);
	return { actorId };
}

export function getUtcDayKey(date = new Date()): string {
	return date.toISOString().slice(0, 10);
}
