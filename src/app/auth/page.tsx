import { AuthPageClient } from "@/components/auth-page-client";

export default function AuthPage() {
	const isGoogleAuthEnabled = Boolean(
		process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET,
	);

	return <AuthPageClient isGoogleAuthEnabled={isGoogleAuthEnabled} />;
}
