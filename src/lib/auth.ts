import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { env } from "@/env";
import { db } from "@/db";
import { accounts, sessions, users, verifications } from "@/db/schema";
import {
	buildResetPasswordEmail,
	buildVerificationEmail,
	sendAuthEmail,
} from "@/lib/email";

const googleClientId = env.GOOGLE_CLIENT_ID;
const googleClientSecret = env.GOOGLE_CLIENT_SECRET;

export const auth = betterAuth({
	appName: "WavesToText",
	database: drizzleAdapter(db, {
		provider: "sqlite",
		schema: {
			user: users,
			session: sessions,
			account: accounts,
			verification: verifications,
		},
	}),
	emailAndPassword: {
		enabled: true,
		sendResetPassword: async ({ user, url }) => {
			const email = buildResetPasswordEmail(url, user.name);

			await sendAuthEmail({
				to: user.email,
				subject: email.subject,
				html: email.html,
				text: email.text,
			});
		},
	},
	emailVerification: {
		sendOnSignUp: true,
		sendVerificationEmail: async ({ user, url }) => {
			const email = buildVerificationEmail(url, user.name);
			await sendAuthEmail({
				to: user.email,
				subject: email.subject,
				html: email.html,
				text: email.text,
			});
		},
	},
	plugins: [nextCookies()],
	...(googleClientId && googleClientSecret
		? {
				socialProviders: {
					google: {
						clientId: googleClientId,
						clientSecret: googleClientSecret,
					},
				},
			}
		: {}),
});

export type BetterAuthSession = typeof auth.$Infer.Session;
