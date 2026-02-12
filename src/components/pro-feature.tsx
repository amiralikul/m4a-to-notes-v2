"use client";

import { Crown, Lock } from "lucide-react";
import { PaddleCheckout } from "@/components/paddle-checkout";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { useEntitlements } from "@/hooks/use-entitlements";
import { PRICING_PLANS } from "@/lib/pricing";

/**
 * Component that gates features behind Pro subscription
 * @param {Object} props
 * @param {'basic'|'pro'|'business'} props.requiredPlan - Required plan level
 * @param {React.ReactNode} props.children - Content to show when user has access
 * @param {string} props.feature - Feature name for display
 * @param {string} props.description - Feature description
 */
interface ProFeatureProps {
	requiredPlan?: "basic" | "pro" | "business";
	children: React.ReactNode;
	feature?: string;
	description?: string;
}

export function ProFeature({
	requiredPlan = "pro",
	children,
	feature = "Premium Feature",
	description = "This feature requires a premium subscription.",
}: ProFeatureProps) {
	const { hasAccess, loading, entitlements } = useEntitlements();

	if (loading) {
		return (
			<div className="animate-pulse">
				<div className="h-32 bg-gray-200 rounded"></div>
			</div>
		);
	}

	// User has access - show the feature
	if (hasAccess(requiredPlan)) {
		return children;
	}

	// User doesn't have access - show upgrade prompt
	return (
		<Card className="border-2 border-dashed border-gray-300 bg-gray-50">
			<CardHeader className="text-center">
				<div className="mx-auto w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mb-4">
					{requiredPlan === "business" ? (
						<Crown className="w-6 h-6 text-white" />
					) : (
						<Lock className="w-6 h-6 text-white" />
					)}
				</div>
				<CardTitle className="text-lg">{feature}</CardTitle>
				<CardDescription className="text-center max-w-sm mx-auto">
					{description}
				</CardDescription>
			</CardHeader>

			<CardContent className="text-center space-y-4">
				<div className="text-sm text-gray-600">
					<p>
						Your current plan:{" "}
						<strong className="capitalize">
							{entitlements?.plan || "free"}
						</strong>
					</p>
					<p>
						Required plan:{" "}
						<strong className="capitalize">{requiredPlan}</strong>
					</p>
				</div>

				<div className="flex justify-center">
					{requiredPlan === "pro" && PRICING_PLANS.PRO.priceId ? (
						<PaddleCheckout
							priceId={PRICING_PLANS.PRO.priceId}
							className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
						>
							<Crown className="w-4 h-4 mr-2" />
							Upgrade to Pro - ${PRICING_PLANS.PRO.price}/mo
						</PaddleCheckout>
					) : requiredPlan === "business" && PRICING_PLANS.BUSINESS.priceId ? (
						<PaddleCheckout
							priceId={PRICING_PLANS.BUSINESS.priceId}
							className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
						>
							<Crown className="w-4 h-4 mr-2" />
							Upgrade to Business - ${PRICING_PLANS.BUSINESS.price}/mo
						</PaddleCheckout>
					) : (
						<Button disabled>
							Upgrade to{" "}
							{requiredPlan.charAt(0).toUpperCase() + requiredPlan.slice(1)}
						</Button>
					)}
				</div>

				<p className="text-xs text-gray-500">
					Cancel anytime • 30-day money-back guarantee
				</p>
			</CardContent>
		</Card>
	);
}

/**
 * Simple wrapper for Pro-only content
 */
export function ProOnly({ children }: { children: React.ReactNode }) {
	return (
		<ProFeature
			requiredPlan="pro"
			feature="Pro Feature"
			description="This feature is available to Pro and Business subscribers."
		>
			{children}
		</ProFeature>
	);
}

/**
 * Simple wrapper for Business-only content
 */
export function BusinessOnly({ children }: { children: React.ReactNode }) {
	return (
		<ProFeature
			requiredPlan="business"
			feature="Business Feature"
			description="This advanced feature is available to Business subscribers."
		>
			{children}
		</ProFeature>
	);
}
