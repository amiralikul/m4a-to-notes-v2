"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type AuthTab = "signin" | "signup";

const dashboardPath = "/dashboard";

export function AuthPageClient({
	isGoogleAuthEnabled,
}: {
	isGoogleAuthEnabled: boolean;
}) {
	const router = useRouter();
	const searchParams = useSearchParams();
	const tab: AuthTab = searchParams.get("tab") === "signup" ? "signup" : "signin";
	const [signInEmail, setSignInEmail] = useState("");
	const [signInPassword, setSignInPassword] = useState("");
	const [signUpName, setSignUpName] = useState("");
	const [signUpEmail, setSignUpEmail] = useState("");
	const [signUpPassword, setSignUpPassword] = useState("");
	const [signInError, setSignInError] = useState<string | null>(null);
	const [signUpError, setSignUpError] = useState<string | null>(null);
	const [socialError, setSocialError] = useState<string | null>(null);
	const [isSigningIn, setIsSigningIn] = useState(false);
	const [isSigningUp, setIsSigningUp] = useState(false);
	const [isSocialLoading, setIsSocialLoading] = useState(false);

	const handleEmailSignIn: React.ComponentProps<"form">["onSubmit"] = async (
		event,
	) => {
		if (!event) {
			return;
		}
		event.preventDefault();
		setIsSigningIn(true);
		setSignInError(null);
		try {
			const { error } = await authClient.signIn.email({
				email: signInEmail,
				password: signInPassword,
				callbackURL: dashboardPath,
			});

			if (error) {
				setSignInError(error.message || "Could not sign in.");
				return;
			}

			router.push(dashboardPath);
			router.refresh();
		} catch {
			setSignInError("Could not sign in. Check your connection and try again.");
		} finally {
			setIsSigningIn(false);
		}
	};

	const handleEmailSignUp: React.ComponentProps<"form">["onSubmit"] = async (
		event,
	) => {
		if (!event) {
			return;
		}
		event.preventDefault();
		setIsSigningUp(true);
		setSignUpError(null);
		try {
			const { error } = await authClient.signUp.email({
				name: signUpName,
				email: signUpEmail,
				password: signUpPassword,
				callbackURL: dashboardPath,
			});

			if (error) {
				setSignUpError(error.message || "Could not create your account.");
				return;
			}

			router.push(dashboardPath);
			router.refresh();
		} catch {
			setSignUpError(
				"Could not create your account. Check your connection and try again.",
			);
		} finally {
			setIsSigningUp(false);
		}
	};

	const handleGoogleSignIn = async () => {
		setIsSocialLoading(true);
		setSocialError(null);
		try {
			const { error } = await authClient.signIn.social({
				provider: "google",
				callbackURL: dashboardPath,
			});

			if (error) {
				setSocialError(error.message || "Could not start Google sign in.");
			}
		} catch {
			setSocialError(
				"Could not start Google sign in. Check your connection and try again.",
			);
		} finally {
			setIsSocialLoading(false);
		}
	};

	return (
		<div className="min-h-[calc(100vh-4rem)] px-4 py-12">
			<div className="mx-auto max-w-md">
				<Card className="border-stone-200 shadow-sm">
					<CardHeader className="space-y-2 text-center">
						<CardTitle className="text-2xl">Welcome back</CardTitle>
						<CardDescription>
							Sign in or create an account to manage your transcriptions.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<Tabs
							value={tab}
							onValueChange={(value) => {
								const nextTab = value === "signup" ? "signup" : "signin";
								router.replace(
									nextTab === "signup" ? "/auth?tab=signup" : "/auth",
								);
							}}
							className="space-y-6"
						>
							<TabsList className="grid w-full grid-cols-2">
								<TabsTrigger value="signin">Sign In</TabsTrigger>
								<TabsTrigger value="signup">Sign Up</TabsTrigger>
							</TabsList>

							<TabsContent value="signin" className="space-y-4">
								<form onSubmit={handleEmailSignIn} className="space-y-4">
									<div className="space-y-2">
										<Label htmlFor="signin-email">Email</Label>
										<Input
											id="signin-email"
											type="email"
											autoComplete="email"
											value={signInEmail}
											onChange={(event) => setSignInEmail(event.target.value)}
											required
										/>
									</div>
									<div className="space-y-2">
										<Label htmlFor="signin-password">Password</Label>
										<Input
											id="signin-password"
											type="password"
											autoComplete="current-password"
											value={signInPassword}
											onChange={(event) => setSignInPassword(event.target.value)}
											required
										/>
									</div>
									{signInError ? (
										<p className="text-sm text-red-600">{signInError}</p>
									) : null}
									<Button type="submit" className="w-full" disabled={isSigningIn}>
										{isSigningIn ? "Signing in..." : "Sign In"}
									</Button>
								</form>
							</TabsContent>

							<TabsContent value="signup" className="space-y-4">
								<form onSubmit={handleEmailSignUp} className="space-y-4">
									<div className="space-y-2">
										<Label htmlFor="signup-name">Name</Label>
										<Input
											id="signup-name"
											autoComplete="name"
											value={signUpName}
											onChange={(event) => setSignUpName(event.target.value)}
											required
										/>
									</div>
									<div className="space-y-2">
										<Label htmlFor="signup-email">Email</Label>
										<Input
											id="signup-email"
											type="email"
											autoComplete="email"
											value={signUpEmail}
											onChange={(event) => setSignUpEmail(event.target.value)}
											required
										/>
									</div>
									<div className="space-y-2">
										<Label htmlFor="signup-password">Password</Label>
										<Input
											id="signup-password"
											type="password"
											autoComplete="new-password"
											value={signUpPassword}
											onChange={(event) => setSignUpPassword(event.target.value)}
											required
										/>
									</div>
									{signUpError ? (
										<p className="text-sm text-red-600">{signUpError}</p>
									) : null}
									<Button type="submit" className="w-full" disabled={isSigningUp}>
										{isSigningUp ? "Creating account..." : "Create Account"}
									</Button>
								</form>
							</TabsContent>
						</Tabs>

						{isGoogleAuthEnabled ? (
							<div className="mt-6 space-y-3">
								<div className="relative text-center text-xs uppercase tracking-[0.2em] text-stone-500">
									<span className="bg-white px-2">or continue with</span>
									<div className="absolute inset-x-0 top-1/2 -z-10 h-px bg-stone-200" />
								</div>
								<Button
									type="button"
									variant="outline"
									className="w-full"
									onClick={handleGoogleSignIn}
									disabled={isSocialLoading}
								>
									{isSocialLoading ? "Redirecting..." : "Continue with Google"}
								</Button>
								{socialError ? (
									<p className="text-sm text-red-600">{socialError}</p>
								) : null}
							</div>
						) : null}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
