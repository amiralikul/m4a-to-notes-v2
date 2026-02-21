"use client";

import { useUser } from "@clerk/nextjs";
import {
	AlertCircle,
	ArrowRight,
	Calendar,
	CheckCircle,
	Clock,
	Crown,
	XCircle,
	Zap,
} from "lucide-react";
import { useState } from "react";
import {
	CancellationSuccess,
	CancelSubscription,
} from "@/components/cancel-subscription";
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

export default function SubscriptionPage() {
	const { user, isLoaded } = useUser();
	const {
		entitlements,
		loading,
		error,
		refetch: fetchEntitlements,
		canUpgradeTo,
	} = useEntitlements();

	console.log({user})
	const [cancellationSuccess, setCancellationSuccess] = useState<string | null>(null);

	const getPlanDetails = (planKey: string | undefined) => {
		const plan = planKey ? PRICING_PLANS[planKey.toUpperCase()] : undefined;
		return plan || PRICING_PLANS.FREE;
	};

	const getStatusIcon = (status: string) => {
		switch (status) {
			case "active":
				return <CheckCircle className="w-5 h-5 text-green-500" />;
			case "trialing":
				return <Clock className="w-5 h-5 text-yellow-500" />;
			case "past_due":
				return <AlertCircle className="w-5 h-5 text-orange-500" />;
			case "canceled":
				return <XCircle className="w-5 h-5 text-red-500" />;
			default:
				return <Clock className="w-5 h-5 text-gray-500" />;
		}
	};

	const getStatusBadge = (status: string) => {
		const variants: Record<string, string> = {
			active: "bg-green-100 text-green-800",
			trialing: "bg-yellow-100 text-yellow-800",
			past_due: "bg-orange-100 text-orange-800",
			canceled: "bg-red-100 text-red-800",
			none: "bg-gray-100 text-gray-800",
		};
		return variants[status] || variants.none;
	};

	const getPlanIcon = (plan: string | undefined) => {
		switch (plan) {
			case "pro":
				return <Crown className="w-6 h-6 text-blue-500" />;
				default:
				return <Zap className="w-6 h-6 text-gray-500" />;
		}
	};

	const getAvailableUpgrades = (currentPlan: string | undefined) => {
		const plans = Object.entries(PRICING_PLANS).map(([key, plan]) => ({
			key: key.toLowerCase(),
			...plan,
		}));

		return plans.filter((p) => (p.monthlyVariantId || p.yearlyVariantId) && canUpgradeTo(p.key as "free" | "pro"));
	};

	const handleCancellationSuccess = async (method: string) => {
		setCancellationSuccess(method);
		await fetchEntitlements();
	};

	if (!isLoaded) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-lg">Loading...</div>
			</div>
		);
	}

	if (!user) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<Card className="w-96">
					<CardHeader>
						<CardTitle>Authentication Required</CardTitle>
						<CardDescription>
							Please sign in to view your subscription
						</CardDescription>
					</CardHeader>
				</Card>
			</div>
		);
	}

	if (loading) {
		return (
			<div className="container mx-auto py-8">
				<div className="space-y-6 animate-pulse">
					<div className="h-8 bg-gray-200 rounded w-64"></div>
					<div className="grid gap-6">
						<div className="h-48 bg-gray-200 rounded"></div>
						<div className="h-32 bg-gray-200 rounded"></div>
					</div>
				</div>
			</div>
		);
	}

	const currentPlan = getPlanDetails(entitlements?.plan);
	const availableUpgrades = getAvailableUpgrades(entitlements?.plan);
	const isSubscriptionActive = ["active", "trialing"].includes(
		entitlements?.status ?? "",
	);

	return (
		<div className="container mx-auto py-8 space-y-8">
			{/* Header */}
			<div className="text-center space-y-2">
				<h1 className="text-3xl font-bold">Your Subscription</h1>
				<p className="text-gray-600">
					Manage your plan and billing preferences
				</p>
			</div>

			{/* Success State */}
			{cancellationSuccess && (
				<CancellationSuccess
					method={cancellationSuccess}
					onClose={() => setCancellationSuccess(null)}
				/>
			)}

			{/* Error State */}
			{error && (
				<Card className="border-red-200 bg-red-50">
					<CardContent className="pt-6">
						<div className="flex items-center gap-3 text-red-600">
							<AlertCircle className="w-5 h-5" />
							<span>Failed to load subscription details: {error}</span>
							<Button onClick={fetchEntitlements} size="sm" variant="outline">
								Retry
							</Button>
						</div>
					</CardContent>
				</Card>
			)}

			<div className="grid lg:grid-cols-3 gap-6">
				{/* Current Plan */}
				<div className="lg:col-span-2 space-y-6">
					<Card className="relative overflow-hidden">
						{entitlements?.plan !== "free" && (
							<div className="absolute top-0 right-0 bg-gradient-to-l from-blue-500 to-purple-500 text-white text-xs px-3 py-1 rounded-bl-lg">
								PREMIUM
							</div>
						)}

						<CardHeader>
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-3">
									{getPlanIcon(entitlements?.plan)}
									<div>
										<CardTitle className="flex items-center gap-3">
											{currentPlan.name} Plan
											{entitlements?.status && (
												<Badge className={getStatusBadge(entitlements.status)}>
													{getStatusIcon(entitlements.status)}
													{entitlements.status.replace("_", " ").toUpperCase()}
												</Badge>
											)}
										</CardTitle>
										<CardDescription>
											{entitlements?.plan === "free"
												? "You're on the free plan with basic features"
												: `Active ${currentPlan.name} subscription`}
										</CardDescription>
									</div>
								</div>
								<div className="text-right">
									<div className="text-3xl font-bold">
										${currentPlan.monthlyPrice.toFixed(2)}
										{currentPlan.monthlyPrice > 0 && (
											<span className="text-sm text-gray-500 font-normal">
												/month
											</span>
										)}
									</div>
								</div>
							</div>
						</CardHeader>

						<CardContent className="space-y-6">
							{/* Plan Features */}
							<div>
								<h4 className="font-semibold mb-3">What's included:</h4>
								<div className="grid md:grid-cols-2 gap-2">
									{currentPlan.features.map((feature, index) => (
										<div
											key={index}
											className="flex items-center gap-2 text-sm"
										>
											<CheckCircle className="w-4 h-4 text-green-500" />
											<span>{feature}</span>
										</div>
									))}
								</div>
							</div>

							{/* Subscription Details */}
							{entitlements?.meta && (
								<div className="pt-4 border-t">
									<div className="grid md:grid-cols-2 gap-4 text-sm">
										{entitlements.meta.subscriptionId && (
											<div>
												<span className="font-medium text-gray-500">
													Subscription ID
												</span>
												<div className="font-mono text-xs bg-gray-100 px-2 py-1 rounded mt-1">
													{entitlements.meta.subscriptionId}
												</div>
											</div>
										)}

										{(entitlements.meta.renewsAt || entitlements.meta.endsAt) && (
											<div>
												<span className="font-medium text-gray-500">
													{isSubscriptionActive
														? "Next billing date"
														: "Expires on"}
												</span>
												<div className="flex items-center gap-1 mt-1">
													<Calendar className="w-4 h-4 text-gray-400" />
													<span>
														{new Date(
															(entitlements.meta.renewsAt || entitlements.meta.endsAt) as string,
														).toLocaleDateString()}
													</span>
												</div>
											</div>
										)}

										<div>
											<span className="font-medium text-gray-500">
												Last updated
											</span>
											<div className="text-gray-600 mt-1">
												{entitlements.updatedAt ? new Date(entitlements.updatedAt).toLocaleDateString() : "N/A"}
											</div>
										</div>
									</div>
								</div>
							)}
						</CardContent>
					</Card>

					{/* Usage Overview (Placeholder for future implementation) */}
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Zap className="w-5 h-5" />
								Usage This Month
							</CardTitle>
							<CardDescription>
								Track your transcription usage and limits
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="bg-gray-50 rounded-lg p-6 text-center">
								<div className="text-gray-500 mb-2">
									<Zap className="w-8 h-8 mx-auto mb-2 text-gray-400" />
									<p>Usage tracking coming soon</p>
								</div>
								<p className="text-sm text-gray-400">
									We&apos;re working on detailed usage analytics for your
									transcription minutes
								</p>
							</div>
						</CardContent>
					</Card>
				</div>

				{/* Upgrade Options */}
				<div className="space-y-6">
					{availableUpgrades.length > 0 && (
						<Card>
							<CardHeader>
								<CardTitle>Upgrade Your Plan</CardTitle>
								<CardDescription>
									Get access to more features and higher limits
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								{availableUpgrades.map((plan) => (
									<div
										key={plan.key}
										className="border rounded-lg p-4 space-y-3"
									>
										<div className="flex items-center justify-between">
											<div>
												<h4 className="font-semibold flex items-center gap-2">
													{getPlanIcon(plan.key)}
													{plan.name}
												</h4>
												<p className="text-2xl font-bold text-blue-600">
													${plan.monthlyPrice.toFixed(2)}/mo
												</p>
											</div>
										</div>

										<div className="space-y-1">
											{plan.features.slice(0, 3).map((feature, i) => (
												<div
													key={i}
													className="flex items-center gap-2 text-sm text-gray-600"
												>
													<CheckCircle className="w-3 h-3 text-green-500" />
													<span>{feature}</span>
												</div>
											))}
											{plan.features.length > 3 && (
												<div className="text-xs text-gray-400">
													+{plan.features.length - 3} more features
												</div>
											)}
										</div>

										<LemonSqueezyCheckout
											variantId={plan.monthlyVariantId}
											planKey={plan.key}
											className="w-full"
										>
											<div className="flex items-center justify-center gap-2">
												Upgrade to {plan.name}
												<ArrowRight className="w-4 h-4" />
											</div>
										</LemonSqueezyCheckout>
									</div>
								))}
							</CardContent>
						</Card>
					)}

					{/* Billing Information */}
					<Card>
						<CardHeader>
							<CardTitle>Billing Information</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="text-sm space-y-2">
								<div className="flex justify-between">
									<span className="text-gray-500">Billing email</span>
									<span>{user.primaryEmailAddress?.emailAddress}</span>
								</div>
							</div>

							<div className="pt-4 border-t space-y-3">
								<p className="text-xs text-gray-500 text-center">
									Manage payment methods and invoices through the customer portal
								</p>

								{/* Cancel Subscription */}
								<div className="pt-2 border-t">
									<CancelSubscription
										entitlements={entitlements}
										onCancellationSuccess={handleCancellationSuccess}
										variant="outline"
										className="w-full text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
									/>
									<p className="text-xs text-gray-500 mt-2 text-center">
										Cancel anytime - access continues until your billing period
										ends
									</p>
								</div>
							</div>
						</CardContent>
					</Card>

					{/* Support */}
					<Card>
						<CardHeader>
							<CardTitle>Need Help?</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="space-y-3 text-sm">
								<p className="text-gray-600">
									Questions about your subscription or billing?
								</p>
								<Button variant="outline" className="w-full">
									Contact Support
								</Button>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}
