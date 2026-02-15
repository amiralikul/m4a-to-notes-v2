"use client";

import { CheckCircle, Star } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { LemonSqueezyCheckout } from "@/components/lemonsqueezy-checkout";
import { Badge } from "@/components/ui/badge";
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

export function PricingSection() {
	const { entitlements, loading, getCurrentPlan, hasActiveSubscription } =
		useEntitlements();
	const [billingInterval, setBillingInterval] = useState<"monthly" | "yearly">("monthly");

	const getPrice = (plan: (typeof PRICING_PLANS)[string]) =>
		billingInterval === "yearly" ? plan.yearlyPrice : plan.monthlyPrice;

	const getVariantId = (plan: (typeof PRICING_PLANS)[string]) =>
		billingInterval === "yearly" ? plan.yearlyVariantId : plan.monthlyVariantId;

	return (
		<section id="pricing" className="w-full py-12 md:py-24 lg:py-32 bg-muted">
			<div className="container px-4 md:px-6">
				<div className="flex flex-col items-center justify-center space-y-4 text-center">
					<div className="space-y-2">
						<h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
							Simple Pricing
						</h2>
						<p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
							Choose the plan that fits your transcription needs. Start with our
							free tier or upgrade for unlimited access.
						</p>
					</div>

					{/* Billing Interval Toggle */}
					<div className="flex items-center gap-2 bg-background rounded-lg p-1 border">
						<button
							type="button"
							onClick={() => setBillingInterval("monthly")}
							className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
								billingInterval === "monthly"
									? "bg-primary text-primary-foreground"
									: "text-muted-foreground hover:text-foreground"
							}`}
						>
							Monthly
						</button>
						<button
							type="button"
							onClick={() => setBillingInterval("yearly")}
							className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
								billingInterval === "yearly"
									? "bg-primary text-primary-foreground"
									: "text-muted-foreground hover:text-foreground"
							}`}
						>
							Yearly
							{PRICING_PLANS.PRO.yearlyPrice > 0 && (
								<span className="ml-1 text-xs">
									(Save {Math.round((1 - PRICING_PLANS.PRO.yearlyPrice / (PRICING_PLANS.PRO.monthlyPrice * 12)) * 100)}%)
								</span>
							)}
						</button>
					</div>
				</div>

				<div className="mx-auto grid max-w-3xl items-start gap-6 py-12 lg:grid-cols-2 lg:gap-8">
					{/* Free Plan */}
					<Card
						className={`relative ${getCurrentPlan() === "free" && hasActiveSubscription() ? "ring-2 ring-green-500" : ""}`}
					>
						{getCurrentPlan() === "free" && (
							<div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
								<Badge className="bg-green-500 text-white">
									<CheckCircle className="mr-1 h-3 w-3" />
									Current Plan
								</Badge>
							</div>
						)}
						<CardHeader className="text-center">
							<CardTitle className="text-2xl">Free</CardTitle>
							<div className="text-4xl font-bold">$0</div>
							<CardDescription>
								Perfect for trying out our service
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<ul className="space-y-2 text-sm">
								{PRICING_PLANS.FREE.features.map((feature, index) => (
									<li key={index} className="flex items-center">
										<CheckCircle className="mr-2 h-4 w-4 text-green-500" />
										{feature}
									</li>
								))}
							</ul>
							{getCurrentPlan() === "free" ? (
								<Button className="w-full" variant="outline" disabled>
									<CheckCircle className="mr-2 h-4 w-4" />
									Current Plan
								</Button>
							) : (
								<Link href="/#pricing">
									<Button className="w-full" variant="outline">
										Get Started Free
									</Button>
								</Link>
							)}
						</CardContent>
					</Card>

					{/* Unlimited Plan */}
					<Card
						className={`relative ${getCurrentPlan() === "pro" && hasActiveSubscription() ? "ring-2 ring-green-500" : "border-primary"}`}
					>
						<div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
							{getCurrentPlan() === "pro" && hasActiveSubscription() ? (
								<Badge className="bg-green-500 text-white">
									<CheckCircle className="mr-1 h-3 w-3" />
									Current Plan
								</Badge>
							) : (
								<Badge className="bg-primary text-primary-foreground">
									<Star className="mr-1 h-3 w-3" />
									Most Popular
								</Badge>
							)}
						</div>
						<CardHeader className="text-center">
							<CardTitle className="text-2xl">
								{PRICING_PLANS.PRO.name}
							</CardTitle>
							<div className="text-4xl font-bold">
								${getPrice(PRICING_PLANS.PRO).toFixed(2)}
								<span className="text-lg font-normal">
									/{billingInterval === "yearly" ? "year" : "month"}
								</span>
							</div>
							{billingInterval === "yearly" && PRICING_PLANS.PRO.yearlyPrice > 0 && (
								<CardDescription>
									${(PRICING_PLANS.PRO.yearlyPrice / 12).toFixed(2)}/mo billed annually
								</CardDescription>
							)}
							{billingInterval === "monthly" && (
								<CardDescription>
									For professionals and small teams
								</CardDescription>
							)}
						</CardHeader>
						<CardContent className="space-y-4">
							<ul className="space-y-2 text-sm">
								{PRICING_PLANS.PRO.features.map((feature, index) => (
									<li key={index} className="flex items-center">
										<CheckCircle className="mr-2 h-4 w-4 text-green-500" />
										{feature}
									</li>
								))}
							</ul>
							<LemonSqueezyCheckout
								variantId={getVariantId(PRICING_PLANS.PRO)}
								planKey="pro"
								className="w-full"
							>
								Start {PRICING_PLANS.PRO.name} Plan
							</LemonSqueezyCheckout>
						</CardContent>
					</Card>
				</div>

				{/* Additional Info */}
				<div className="text-center space-y-4">
					<p className="text-sm text-muted-foreground">
						All plans include secure file handling and automatic deletion after
						24 hours
					</p>
					<div className="flex justify-center space-x-4 text-xs text-muted-foreground">
						<span>No setup fees</span>
						<span>Cancel anytime</span>
					</div>
				</div>
			</div>
		</section>
	);
}
