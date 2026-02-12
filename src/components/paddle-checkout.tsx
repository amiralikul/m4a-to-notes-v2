"use client";

import { useUser } from "@clerk/nextjs";
import { CheckCircle, Crown } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useEntitlements } from "../hooks/use-entitlements";
import { PRICING_PLANS } from "../lib/pricing";
import { usePaddle } from "./paddle-provider";
import { Button } from "./ui/button";

interface PaddleCheckoutProps {
	priceId: string | null;
	quantity?: number;
	customerEmail?: string | null;
	className?: string;
	children?: React.ReactNode;
	planKey?: string | null;
}

export function PaddleCheckout({
	priceId,
	quantity = 1,
	customerEmail = null,
	className = "",
	children,
	planKey = null,
}: PaddleCheckoutProps) {
	const { user, isLoaded: isUserLoaded } = useUser();
	const { paddle, isLoading, error } = usePaddle();
	const {
		entitlements,
		loading: entitlementsLoading,
		canPurchase,
		getSubscriptionMessage,
		hasActiveSubscription,
	} = useEntitlements();
	const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);

	type PlanType = "free" | "pro" | "business";

	// Determine target plan from priceId if planKey not provided
	const getTargetPlan = (): PlanType => {
		if (planKey) return planKey as PlanType;

		// Map priceId to plan
		for (const [key, plan] of Object.entries(PRICING_PLANS)) {
			if (plan.priceId === priceId) {
				return key.toLowerCase() as PlanType;
			}
		}
		return "free";
	};

	const targetPlan = getTargetPlan();

	const openCheckout = async () => {
		if (!paddle) {
			console.error("Paddle not initialized");
			return;
		}

		if (!priceId) {
			console.error("Price ID is required");
			return;
		}

		if (!isUserLoaded || !user) {
			console.error("User must be logged in to purchase");
			return;
		}

		// Pre-purchase validation with backend
		try {
			const validationResponse = await fetch("/api/validate-purchase", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					priceId,
					planKey: targetPlan,
				}),
			});

			const validation = await validationResponse.json();

			if (!validation.valid) {
				console.error("Purchase validation failed:", validation.message);
				alert(`Purchase not allowed: ${validation.message}`);
				return;
			}

			console.log("Purchase validation passed:", validation.message);
		} catch (validationError) {
			console.error("Failed to validate purchase:", validationError);
			// Continue with purchase if validation fails (graceful degradation)
		}

		setIsCheckoutLoading(true);

		try {
			const checkoutOptions: any = {
				items: [{ priceId, quantity }],
				settings: {
					displayMode: "overlay",
					theme: "light",
					locale: "en",
				},
			};

			// Add customer info from Clerk user
			const userEmail = customerEmail || user.primaryEmailAddress?.emailAddress;
			if (userEmail) {
				checkoutOptions.customer = { email: userEmail };
			}

			// Add custom data with Clerk user ID for webhook processing
			checkoutOptions.customData = {
				clerkUserId: user.id,
			};

			// Add return URL for successful checkout
			if (typeof window !== "undefined") {
				checkoutOptions.settings.successUrl = `${window.location.origin}/checkout/success`;
			}

			console.log("Opening checkout with options:", {
				priceId,
				quantity,
				userEmail,
				clerkUserId: user.id,
			});

			await paddle.Checkout.open(checkoutOptions);
		} catch (err) {
			console.error("Checkout error:", err);
		} finally {
			setIsCheckoutLoading(false);
		}
	};

	if (error) {
		return (
			<Button disabled className={className}>
				Paddle Error
			</Button>
		);
	}

	if (!priceId) {
		return (
			<Button
				disabled
				className={className}
				title="Price ID not configured - see Paddle dashboard setup"
			>
				Setup Required
			</Button>
		);
	}

	if (!isUserLoaded || entitlementsLoading) {
		return (
			<Button disabled className={className}>
				Loading...
			</Button>
		);
	}

	if (!user) {
		return (
			<Button disabled className={className} title="Please sign in to purchase">
				Sign In Required
			</Button>
		);
	}

	// Check subscription status and show appropriate state
	const subscriptionMessage = getSubscriptionMessage(targetPlan);

	if (subscriptionMessage) {
		switch (subscriptionMessage.type) {
			case "current":
				return (
					<Button
						disabled
						className={`${className} bg-green-100 text-green-800 hover:bg-green-100 border-green-200`}
					>
						<CheckCircle className="w-4 h-4 mr-2" />
						Current Plan
					</Button>
				);

			case "downgrade":
				return (
					<div className="space-y-2">
						<Button
							disabled
							className={`${className} bg-gray-100 text-gray-600 hover:bg-gray-100`}
						>
							<Crown className="w-4 h-4 mr-2" />
							Already on Higher Plan
						</Button>
						<p className="text-xs text-gray-500 text-center">
							{subscriptionMessage.message}
						</p>
					</div>
				);

			case "upgrade":
				return (
					<div className="space-y-2">
						<Button
							onClick={openCheckout}
							disabled={isLoading || isCheckoutLoading || !paddle}
							className={className}
						>
							{isLoading || isCheckoutLoading
								? "Loading..."
								: `Upgrade to ${targetPlan.charAt(0).toUpperCase() + targetPlan.slice(1)}`}
						</Button>
						<p className="text-xs text-blue-600 text-center">
							{subscriptionMessage.message}
						</p>
					</div>
				);
		}
	}

	// Default case - user can purchase
	return (
		<Button
			onClick={openCheckout}
			disabled={isLoading || isCheckoutLoading || !paddle}
			className={className}
		>
			{isLoading || isCheckoutLoading ? "Loading..." : children || "Buy Now"}
		</Button>
	);
}

// Example usage component
export function ExampleCheckout() {
	return (
		<div className="space-y-4 p-4">
			<h2 className="text-xl font-bold">Example Paddle Checkout</h2>
			<p className="text-gray-600">
				Replace the priceId with your actual Paddle price ID from your
				dashboard.
			</p>

			<div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
				<p className="text-yellow-800 text-sm">
					<strong>⚠️ Setup Required:</strong> This will show a 400 error until
					you:
				</p>
				<ol className="list-decimal ml-4 space-y-1 text-yellow-700 text-sm mt-2">
					<li>Create a product in your Paddle sandbox dashboard</li>
					<li>Create a price for that product</li>
					<li>Copy the real price ID and update the code below</li>
				</ol>
			</div>

			<PaddleCheckout
				priceId="pri_example_price_id"
				quantity={1}
				customerEmail="customer@example.com"
			>
				Purchase Product (Will Error - Demo Only)
			</PaddleCheckout>

			<div className="text-sm text-gray-500 mt-4">
				<p>
					<strong>Steps to fix the 400 error:</strong>
				</p>
				<ol className="list-decimal ml-4 space-y-1">
					<li>Go to your Paddle sandbox dashboard</li>
					<li>Navigate to Catalog → Products</li>
					<li>Create a new product (e.g., &quot;Pro Plan&quot;)</li>
					<li>Add a price to the product (e.g., $19/month)</li>
					<li>Copy the price ID (starts with &quot;pri_&quot;)</li>
					<li>Update /src/lib/pricing.js with the real price ID</li>
					<li>
						Test with card: 4242 4242 4242 4242, any future date, CVC: 100
					</li>
				</ol>

				<div className="mt-4 p-3 bg-gray-50 rounded">
					<p className="font-medium">Example valid price ID format:</p>
					<code className="text-green-600">pri_01abc123def456789</code>
				</div>
			</div>
		</div>
	);
}
