import { Suspense } from "react";
import { AuthPageClient } from "@/components/auth-page-client";
import { env } from "@/env";

function AuthPageFallback() {
	return <div className="min-h-[calc(100vh-4rem)] px-4 py-12" />;
}

export default function AuthPage() {
	const isGoogleAuthEnabled = Boolean(
		env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET,
	);

	return (
		<Suspense fallback={<AuthPageFallback />}>
			<AuthPageClient isGoogleAuthEnabled={isGoogleAuthEnabled} />
		</Suspense>
	);
}
