import { describe, expect, it, vi } from "vitest";
import {
	buildResetPasswordEmail,
	buildVerificationEmail,
	type EmailSender,
	type SendEmailInput,
	ResendEmailSender,
	sendAuthEmail,
} from "@/lib/email";

vi.mock("@/env", () => ({
	env: {
		AUTH_EMAIL_APP_NAME: "AudioScribe",
		AUTH_EMAIL_FROM: "AudioScribe <auth@example.com>",
		RESEND_API_KEY: "re_test",
	},
}));

describe("email", () => {
	it("builds a verification email", () => {
		const email = buildVerificationEmail("https://example.com/verify", "Amir");

		expect(email.subject).toBe("Verify your email");
		expect(email.text).toContain("https://example.com/verify");
		expect(email.html).toContain("Verify email");
		expect(email.html).toContain("Amir");
	});

	it("builds a reset password email", () => {
		const email = buildResetPasswordEmail("https://example.com/reset", "Amir");

		expect(email.subject).toBe("Reset your password");
		expect(email.text).toContain("https://example.com/reset");
		expect(email.html).toContain("Reset password");
		expect(email.html).toContain("Amir");
	});

	it("sends auth email through an injected sender", async () => {
		const sent: SendEmailInput[] = [];
		const sender: EmailSender = {
			send: vi.fn(async (input) => {
				sent.push(input);
			}),
		};

		await sendAuthEmail(
			{
				to: "user@example.com",
				subject: "Verify your email",
				html: "<p>Hello</p>",
				text: "Hello",
			},
			sender,
		);

		expect(sent).toEqual([
			{
				from: "AudioScribe <auth@example.com>",
				to: ["user@example.com"],
				subject: "Verify your email",
				html: "<p>Hello</p>",
				text: "Hello",
			},
		]);
	});

	it("translates resend errors into thrown errors", async () => {
		const resend = {
			emails: {
				send: vi.fn(async () => ({
					error: { message: "rate limited" },
				})),
			},
		};

		const sender = new ResendEmailSender(resend as never);

		await expect(
			sender.send({
				from: "AudioScribe <auth@example.com>",
				to: ["user@example.com"],
				subject: "Hello",
				html: "<p>Hello</p>",
				text: "Hello",
			}),
		).rejects.toThrow("rate limited");
	});
});
