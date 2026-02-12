import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware();

export const config = {
	matcher: [
		// Skip Next.js internals, static files, and non-Clerk API routes
		// Webhook, Inngest, Telegram, and health routes are excluded so Clerk
		// doesn't attempt to parse session cookies on external service requests
		"/((?!_next|api/inngest|api/webhook|api/telegram|api/health|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
	],
};
