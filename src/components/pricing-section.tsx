"use client";

import { CheckCircle, Star } from "lucide-react";
import Link from "next/link";
import { PaddleCheckout } from "@/components/paddle-checkout";
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
				</div>

				<div className="mx-auto grid max-w-5xl items-start gap-6 py-12 lg:grid-cols-3 lg:gap-8">
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

					{/* Pro Plan */}
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
								${PRICING_PLANS.PRO.price}
								<span className="text-lg font-normal">/month</span>
							</div>
							<CardDescription>
								For professionals and small teams
							</CardDescription>
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
							<PaddleCheckout
								priceId={PRICING_PLANS.PRO.priceId}
								planKey="pro"
								quantity={1}
								className="w-full"
							>
								Start Pro Plan
							</PaddleCheckout>
						</CardContent>
					</Card>

					{/* Business Plan */}
					<Card
						className={`relative ${getCurrentPlan() === "business" && hasActiveSubscription() ? "ring-2 ring-green-500" : ""}`}
					>
						{getCurrentPlan() === "business" && hasActiveSubscription() && (
							<div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
								<Badge className="bg-green-500 text-white">
									<CheckCircle className="mr-1 h-3 w-3" />
									Current Plan
								</Badge>
							</div>
						)}
						<CardHeader className="text-center">
							<CardTitle className="text-2xl">
								{PRICING_PLANS.BUSINESS.name}
							</CardTitle>
							<div className="text-4xl font-bold">
								${PRICING_PLANS.BUSINESS.price}
								<span className="text-lg font-normal">/month</span>
							</div>
							<CardDescription>For growing businesses</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<ul className="space-y-2 text-sm">
								{PRICING_PLANS.BUSINESS.features.map((feature, index) => (
									<li key={index} className="flex items-center">
										<CheckCircle className="mr-2 h-4 w-4 text-green-500" />
										{feature}
									</li>
								))}
							</ul>
							<PaddleCheckout
								priceId={PRICING_PLANS.BUSINESS.priceId}
								planKey="business"
								quantity={1}
								className="w-full"
							>
								Start Business Plan
							</PaddleCheckout>
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
						<span>✓ No setup fees</span>
						<span>✓ Cancel anytime</span>
						<span>✓ 30-day money-back guarantee</span>
					</div>
				</div>
			</div>
		</section>
	);
}
