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
			"3 transcriptions per day",
			"AI-powered transcription",
			"Export to TXT",
			"Secure file handling",
		],
	},

	PRO: {
		name: "Unlimited",
		monthlyPrice: 9.9,
		yearlyPrice: 90,
		monthlyVariantId: process.env.NEXT_PUBLIC_LEMONSQUEEZY_PRO_MONTHLY_VARIANT_ID || null,
		yearlyVariantId: process.env.NEXT_PUBLIC_LEMONSQUEEZY_PRO_YEARLY_VARIANT_ID || null,
		features: [
			"Unlimited transcriptions",
			"AI-powered transcription",
			"Export to TXT",
			"Secure file handling",
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
