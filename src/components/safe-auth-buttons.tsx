"use client";

import {
	SignInButton,
	SignUpButton,
	UserButton,
	useAuth,
	useClerk,
} from "@clerk/nextjs";

export function SafeAuthButtons() {
	const { isLoaded, isSignedIn } = useAuth();

	// Show loading skeleton while auth state is being determined
	if (!isLoaded) {
		return (
			<div className="flex items-center gap-4">
				<div className="h-10 w-16 bg-gray-200 animate-pulse rounded"></div>
				<div className="h-10 w-20 bg-gray-200 animate-pulse rounded-full"></div>
			</div>
		);
	}

	// User is signed in, show user button
	if (isSignedIn) {
		return <UserButton showName />;
	}

	// User is not signed in, show auth buttons
	return (
		<>
			<SignInButton mode="modal">
				<button className="text-sm text-gray-600 hover:text-gray-900 transition-colors cursor-pointer">
					Sign In
				</button>
			</SignInButton>
			<SignUpButton mode="modal">
				<button className="bg-[#6c47ff] text-white rounded-full font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 cursor-pointer hover:bg-[#5a3ee6] transition-colors">
					Sign Up
				</button>
			</SignUpButton>
		</>
	);
}
