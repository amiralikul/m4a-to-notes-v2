"use client";

import {
	SignInButton,
	SignUpButton,
	UserButton,
	useAuth,
} from "@clerk/nextjs";

export function SafeAuthButtons() {
	const { isLoaded, isSignedIn } = useAuth();

	if (!isLoaded) {
		return (
			<div className="flex items-center gap-4">
				<div className="h-9 w-16 bg-stone-200 animate-pulse rounded-lg" />
				<div className="h-9 w-20 bg-stone-200 animate-pulse rounded-lg" />
			</div>
		);
	}

	if (isSignedIn) {
		return <UserButton showName />;
	}

	return (
		<>
			<SignInButton mode="modal">
				<button className="text-sm text-stone-500 hover:text-stone-900 transition-colors cursor-pointer font-medium">
					Sign In
				</button>
			</SignInButton>
			<SignUpButton mode="modal">
				<button className="bg-stone-900 text-stone-50 rounded-lg font-medium text-sm h-9 px-4 cursor-pointer hover:bg-stone-800 transition-colors">
					Sign Up
				</button>
			</SignUpButton>
		</>
	);
}
