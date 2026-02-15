"use client";

import { useUser } from "@clerk/nextjs";
import { CheckCircle, Crown } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useEntitlements } from "../hooks/use-entitlements";
import { PRICING_PLANS } from "../lib/pricing";
import { useLemonSqueezy } from "./lemonsqueezy-provider";
import { Button } from "./ui/button";

interface LemonSqueezyCheckoutProps {
	variantId: string | null;
	className?: string;
	children?: React.ReactNode;
	planKey?: string | null;
}

export function LemonSqueezyCheckout({
	variantId,
	className = "",
	children,
	planKey = null,
}: LemonSqueezyCheckoutProps) {
	const { user, isLoaded: isUserLoaded } = useUser();
	const { isLoading, error, openCheckout } = useLemonSqueezy();
	const {
		entitlements,
		loading: entitlementsLoading,
		getSubscriptionMessage,
	} = useEntitlements();
	const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);

	type PlanType = "free" | "pro";

	const getTargetPlan = (): PlanType => {
		if (planKey) return planKey as PlanType;

		for (const [key, plan] of Object.entries(PRICING_PLANS)) {
			if (plan.monthlyVariantId === variantId || plan.yearlyVariantId === variantId) {
				return key.toLowerCase() as PlanType;
			}
		}
		return "free";
	};

	const targetPlan = getTargetPlan();

	const handleCheckout = async () => {
		if (!variantId) return;
		if (!isUserLoaded || !user) return;

		// Pre-purchase validation
		try {
			const validationResponse = await fetch("/api/validate-purchase", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ variantId, planKey: targetPlan }),
			});

			const validation = await validationResponse.json();

			if (!validation.valid) {
				alert(`Purchase not allowed: ${validation.message}`);
				return;
			}
		} catch (validationError) {
			console.error("Failed to validate purchase:", validationError);
			alert("Failed to validate purchase. Please try again.");
			return;
		}

		setIsCheckoutLoading(true);

		try {
			// Create checkout session server-side
			const response = await fetch("/api/lemonsqueezy/checkout", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ variantId, planKey: targetPlan }),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Failed to create checkout");
			}

			const { checkoutUrl } = await response.json();
			openCheckout(checkoutUrl);
		} catch (err) {
			console.error("Checkout error:", err);
		} finally {
			setIsCheckoutLoading(false);
		}
	};

	if (error) {
		return (
			<Button disabled className={className}>
				Checkout Error
			</Button>
		);
	}

	if (!variantId) {
		return (
			<Button
				disabled
				className={className}
				title="Variant ID not configured"
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
							onClick={handleCheckout}
							disabled={isLoading || isCheckoutLoading}
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

	return (
		<Button
			onClick={handleCheckout}
			disabled={isLoading || isCheckoutLoading}
			className={className}
		>
			{isLoading || isCheckoutLoading ? "Loading..." : children || "Buy Now"}
		</Button>
	);
}
