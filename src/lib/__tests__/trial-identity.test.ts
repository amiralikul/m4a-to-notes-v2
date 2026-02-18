import { beforeEach, describe, expect, it } from "vitest";
import {
	resolveActorIdentity,
	signActorId,
	TRIAL_ACTOR_COOKIE_NAME,
	verifySignedActorId,
} from "../trial-identity";

const TEST_SECRET = "trial-cookie-test-secret";

describe("trial identity", () => {
	beforeEach(() => {
		process.env.TRIAL_COOKIE_SECRET = TEST_SECRET;
	});

	it("signs and verifies actor ids", () => {
		const actorId = "123e4567-e89b-12d3-a456-426614174000";
		const signed = signActorId(actorId);
		expect(verifySignedActorId(signed)).toBe(actorId);
	});

	it("rejects tampered signed cookie value", () => {
		const actorId = "123e4567-e89b-12d3-a456-426614174000";
		const signed = signActorId(actorId);
		const tampered = `${signed}x`;
		expect(verifySignedActorId(tampered)).toBeNull();
	});

	it("reuses valid signed cookie", async () => {
		const actorId = "123e4567-e89b-12d3-a456-426614174000";
		const signed = signActorId(actorId);
		const { cookieStore, setCalls } = createMockCookieStore({
			[TRIAL_ACTOR_COOKIE_NAME]: signed,
		});

		const identity = await resolveActorIdentity(cookieStore);

		expect(identity.actorId).toBe(actorId);
		expect(setCalls).toHaveLength(0);
	});

	it("creates and sets a new cookie when missing", async () => {
		const { cookieStore, setCalls } = createMockCookieStore();

		const identity = await resolveActorIdentity(cookieStore);

		expect(identity.actorId).toMatch(
			/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
		);
		expect(setCalls).toHaveLength(1);
		expect(setCalls[0].name).toBe(TRIAL_ACTOR_COOKIE_NAME);
		expect(setCalls[0].value.startsWith(`${identity.actorId}.`)).toBe(true);
	});

	it("replaces invalid cookie value with a new signed cookie", async () => {
		const { cookieStore, setCalls } = createMockCookieStore({
			[TRIAL_ACTOR_COOKIE_NAME]: "invalid-cookie-value",
		});

		const identity = await resolveActorIdentity(cookieStore);

		expect(identity.actorId).toBeTruthy();
		expect(setCalls).toHaveLength(1);
		expect(setCalls[0].value.startsWith(`${identity.actorId}.`)).toBe(true);
	});
});

function createMockCookieStore(initialValues?: Record<string, string>) {
	const values = new Map<string, string>(Object.entries(initialValues || {}));
	const setCalls: Array<{
		name: string;
		value: string;
		options: {
			httpOnly: boolean;
			secure: boolean;
			sameSite: "lax";
			path: string;
			maxAge: number;
		};
	}> = [];

	const cookieStore = {
		get(name: string) {
			const value = values.get(name);
			if (!value) return undefined;
			return { value };
		},
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
		) {
			values.set(name, value);
			setCalls.push({ name, value, options });
		},
	};

	return { cookieStore, setCalls };
}
