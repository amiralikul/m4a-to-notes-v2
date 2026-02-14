"use client";

import { useUser } from "@clerk/nextjs";
import { useCallback, useEffect, useState } from "react";

interface Entitlements {
	userId: string;
	plan: "free" | "pro" | "business";
	status: "none" | "active" | "trialing" | "past_due" | "canceled";
	provider?: string;
	meta?: {
		subscriptionId?: string;
		customerId?: string;
		renewsAt?: string;
		endsAt?: string;
		variantId?: string;
		productName?: string;
	};
	updatedAt?: string;
}

type PlanType = Entitlements["plan"];

export function useEntitlements() {
	const { user, isLoaded } = useUser();
	const [entitlements, setEntitlements] = useState<Entitlements | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchEntitlements = useCallback(async () => {
		if (!user || !isLoaded) {
			setLoading(false);
			return;
		}

		setLoading(true);
		setError(null);

		try {
			const response = await fetch("/api/me/entitlements", {
				cache: "no-store",
			});

			if (!response.ok) {
				throw new Error(`Failed to load entitlements: ${response.status}`);
			}

			const data = await response.json();
			setEntitlements(data.entitlements);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Unknown error");
			console.error("Failed to fetch entitlements:", err);
			// Set default entitlements on error
			setEntitlements({
				userId: user?.id || "",
				plan: "free",
				status: "none",
				provider: "lemonsqueezy",
				meta: {},
				updatedAt: new Date().toISOString(),
			});
		} finally {
			setLoading(false);
		}
	}, [user, isLoaded]);

	useEffect(() => {
		fetchEntitlements();
	}, [isLoaded, user?.id, fetchEntitlements]);

	// Helper functions
	const hasActiveSubscription = () => {
		return entitlements && ["active", "trialing"].includes(entitlements.status);
	};

	const getCurrentPlan = () => {
		return entitlements?.plan || "free";
	};

	const canUpgradeTo = (targetPlan: PlanType) => {
		const currentPlan = getCurrentPlan();
		const planHierarchy: Record<PlanType, number> = { free: 0, pro: 1, business: 2 };

		return planHierarchy[targetPlan] > planHierarchy[currentPlan];
	};

	const canPurchase = (targetPlan: PlanType) => {
		// Can't purchase if already have active subscription for same or higher plan
		if (!hasActiveSubscription()) return true;

		return canUpgradeTo(targetPlan);
	};

	const getSubscriptionMessage = (targetPlan: PlanType) => {
		if (!entitlements) return null;

		const currentPlan = getCurrentPlan();
		const hasActive = hasActiveSubscription();

		if (targetPlan === currentPlan && hasActive) {
			return {
				type: "current",
				message: `You're currently on the ${targetPlan} plan`,
			};
		}

		if (!canUpgradeTo(targetPlan) && hasActive) {
			return {
				type: "downgrade",
				message: `You're already on a higher plan (${currentPlan})`,
			};
		}

		if (hasActive && canUpgradeTo(targetPlan)) {
			return {
				type: "upgrade",
				message: `Upgrade from ${currentPlan} to ${targetPlan}`,
			};
		}

		return null;
	};

	// Additional helper methods for compatibility
	const hasAccess = (feature = "basic") => {
		if (!entitlements) return false;

		const hasActive = hasActiveSubscription();

		switch (feature) {
			case "basic":
				return true; // Everyone has basic access
			case "pro":
				return (
					(entitlements.plan === "pro" && hasActive) ||
					(entitlements.plan === "business" && hasActive)
				);
			case "business":
				return entitlements.plan === "business" && hasActive;
			default:
				return false;
		}
	};

	const isPlan = (plan: PlanType) => {
		return entitlements?.plan === plan;
	};

	const isActive = () => {
		return hasActiveSubscription();
	};

	return {
		entitlements,
		loading,
		error,
		refetch: fetchEntitlements,
		// Helper methods
		hasActiveSubscription,
		getCurrentPlan,
		canUpgradeTo,
		canPurchase,
		getSubscriptionMessage,
		// Additional compatibility methods
		hasAccess,
		isPlan,
		isActive,
	};
}
