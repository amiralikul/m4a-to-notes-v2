import { Resend } from "resend";
import { env } from "@/env";

export type SendEmailInput = {
	from: string;
	html: string;
	subject: string;
	text: string;
	to: string[];
};

export interface EmailSender {
	send(input: SendEmailInput): Promise<void>;
}

export type AuthEmailInput = {
	html: string;
	subject: string;
	text: string;
	to: string;
};

export class ResendEmailSender implements EmailSender {
	constructor(private readonly resend: Resend) {}

	async send(input: SendEmailInput) {
		const { error } = await this.resend.emails.send(input);

		if (error) {
			throw new Error(error.message || "Failed to send email.");
		}
	}
}

function getRequiredEnv(name: "RESEND_API_KEY" | "AUTH_EMAIL_FROM") {
	const value = env[name];

	if (!value) {
		throw new Error(`${name} is required to send auth emails.`);
	}

	return value;
}

function getAppName() {
	return env.AUTH_EMAIL_APP_NAME;
}

function wrapEmailHtml(title: string, body: string) {
	const appName = getAppName();

	return `
		<div style="background:#f5f5f4;padding:32px 16px;font-family:Arial,sans-serif;color:#1c1917;">
			<div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e7e5e4;border-radius:16px;padding:32px;">
				<p style="margin:0 0 12px;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:#78716c;">
					${appName}
				</p>
				<h1 style="margin:0 0 16px;font-size:24px;line-height:1.25;color:#1c1917;">
					${title}
				</h1>
				<div style="font-size:16px;line-height:1.6;color:#44403c;">
					${body}
				</div>
			</div>
		</div>
	`;
}

export function buildVerificationEmail(url: string, name?: string | null) {
	const greeting = name ? `Hi ${name},` : "Hi,";
	const subject = "Verify your email";
	const text = `${greeting}

Confirm your email address to finish setting up your AudioScribe account:
${url}

If you didn't create this account, you can ignore this email.`;
	const html = wrapEmailHtml(
		"Verify your email",
		`
			<p style="margin:0 0 16px;">${greeting}</p>
			<p style="margin:0 0 16px;">
				Confirm your email address to finish setting up your AudioScribe account.
			</p>
			<p style="margin:0 0 24px;">
				<a href="${url}" style="display:inline-block;background:#1c1917;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:999px;font-weight:600;">
					Verify email
				</a>
			</p>
			<p style="margin:0;color:#78716c;font-size:14px;word-break:break-all;">
				If the button doesn't work, use this link:<br />
				<a href="${url}" style="color:#1c1917;">${url}</a>
			</p>
		`,
	);

	return { html, subject, text };
}

export function buildResetPasswordEmail(url: string, name?: string | null) {
	const greeting = name ? `Hi ${name},` : "Hi,";
	const subject = "Reset your password";
	const text = `${greeting}

We received a request to reset your AudioScribe password.
Reset it here:
${url}

If you didn't request this, you can ignore this email.`;
	const html = wrapEmailHtml(
		"Reset your password",
		`
			<p style="margin:0 0 16px;">${greeting}</p>
			<p style="margin:0 0 16px;">
				We received a request to reset your AudioScribe password.
			</p>
			<p style="margin:0 0 24px;">
				<a href="${url}" style="display:inline-block;background:#1c1917;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:999px;font-weight:600;">
					Reset password
				</a>
			</p>
			<p style="margin:0;color:#78716c;font-size:14px;word-break:break-all;">
				If the button doesn't work, use this link:<br />
				<a href="${url}" style="color:#1c1917;">${url}</a>
			</p>
		`,
	);

	return { html, subject, text };
}

export function getDefaultEmailSender() {
	return new ResendEmailSender(new Resend(getRequiredEnv("RESEND_API_KEY")));
}

export async function sendAuthEmail(
	input: AuthEmailInput,
	emailSender: EmailSender = getDefaultEmailSender(),
) {
	await emailSender.send({
		from: getRequiredEnv("AUTH_EMAIL_FROM"),
		to: [input.to],
		subject: input.subject,
		html: input.html,
		text: input.text,
	});
}
