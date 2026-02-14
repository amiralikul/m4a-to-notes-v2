interface PricingPlan {
	name: string;
	monthlyPrice: number;
	yearlyPrice: number;
	monthlyVariantId: string | null;
	yearlyVariantId: string | null;
	features: string[];
}

export const PRICING_PLANS: Record<string, PricingPlan> = {
	FREE: {
		name: "Free",
		monthlyPrice: 0,
		yearlyPrice: 0,
		monthlyVariantId: null,
		yearlyVariantId: null,
		features: [
			"30 minutes of transcription",
			"Basic accuracy",
			"Standard processing speed",
			"Export to TXT",
		],
	},

	PRO: {
		name: "Unlimited",
		monthlyPrice: 9.90,
		yearlyPrice: 90,
		monthlyVariantId: process.env.NEXT_PUBLIC_LEMONSQUEEZY_PRO_MONTHLY_VARIANT_ID || null,
		yearlyVariantId: process.env.NEXT_PUBLIC_LEMONSQUEEZY_PRO_YEARLY_VARIANT_ID || null,
		features: [
			"10 hours of transcription/month",
			"High accuracy (95%+)",
			"Priority processing",
			"Export to TXT, DOCX, PDF",
			"Speaker identification",
			"Timestamps",
		],
	},
};

export function getPlan(planKey: string): PricingPlan | undefined {
	return PRICING_PLANS[planKey.toUpperCase()];
}

export function getSubscriptionPlans(): PricingPlan[] {
	return Object.values(PRICING_PLANS).filter(
		(plan) => plan.monthlyVariantId !== null || plan.yearlyVariantId !== null,
	);
}
