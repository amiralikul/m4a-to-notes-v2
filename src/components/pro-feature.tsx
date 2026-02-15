"use client";

import { Lock } from "lucide-react";
import { LemonSqueezyCheckout } from "@/components/lemonsqueezy-checkout";
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

interface ProFeatureProps {
	requiredPlan?: "basic" | "pro";
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

	if (hasAccess(requiredPlan)) {
		return children;
	}

	return (
		<Card className="border-2 border-dashed border-gray-300 bg-gray-50">
			<CardHeader className="text-center">
				<div className="mx-auto w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mb-4">
					<Lock className="w-6 h-6 text-white" />
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
					{requiredPlan === "pro" && PRICING_PLANS.PRO.monthlyVariantId ? (
						<LemonSqueezyCheckout
							variantId={PRICING_PLANS.PRO.monthlyVariantId}
							planKey="pro"
							className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
						>
							<Lock className="w-4 h-4 mr-2" />
							Upgrade to {PRICING_PLANS.PRO.name} - ${PRICING_PLANS.PRO.monthlyPrice.toFixed(2)}/mo
						</LemonSqueezyCheckout>
					) : (
						<Button disabled>
							Upgrade to{" "}
							{requiredPlan.charAt(0).toUpperCase() + requiredPlan.slice(1)}
						</Button>
					)}
				</div>

				<p className="text-xs text-gray-500">
					Cancel anytime
				</p>
			</CardContent>
		</Card>
	);
}

export function ProOnly({ children }: { children: React.ReactNode }) {
	return (
		<ProFeature
			requiredPlan="pro"
			feature="Pro Feature"
			description="This feature is available to Unlimited subscribers."
		>
			{children}
		</ProFeature>
	);
}

