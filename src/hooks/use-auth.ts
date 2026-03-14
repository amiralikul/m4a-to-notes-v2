"use client";

import { authClient } from "@/lib/auth-client";

export function useAuth() {
	const session = authClient.useSession();
	const data = session.data;

	return {
		isLoaded: !session.isPending,
		isSignedIn: Boolean(data?.user),
		user: data?.user ?? null,
		session: data?.session ?? null,
		error: session.error,
		refetch: session.refetch,
	};
}
