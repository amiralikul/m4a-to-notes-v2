interface PricingPlan {
	name: string;
	price: number;
	priceId: string | null;
	features: string[];
}

export const PRICING_PLANS: Record<string, PricingPlan> = {
	FREE: {
		name: "Free",
		price: 0,
		priceId: null,
		features: [
			"30 minutes of transcription",
			"Basic accuracy",
			"Standard processing speed",
			"Export to TXT",
		],
	},

	PRO: {
		name: "Lite",
		price: 19,
		priceId: "pri_01k399jhfp27dnef4eah1z28y2",
		features: [
			"10 hours of transcription/month",
			"High accuracy (95%+)",
			"Priority processing",
			"Export to TXT, DOCX, PDF",
			"Speaker identification",
			"Timestamps",
		],
	},

	BUSINESS: {
		name: "Business",
		price: 49,
		priceId: null,
		features: [
			"50 hours of transcription/month",
			"Highest accuracy (98%+)",
			"Fastest processing",
			"All export formats",
			"Advanced speaker identification",
			"Custom vocabulary",
			"API access",
			"Priority support",
		],
	},
};

interface OneTimePurchase {
	name: string;
	price: number;
	priceId: string;
	description: string;
	hours: number;
}

export const ONE_TIME_PURCHASES: Record<string, OneTimePurchase> = {
	SMALL_PACK: {
		name: "Small Pack",
		price: 9.99,
		priceId: "pri_small_pack_id",
		description: "5 hours of transcription",
		hours: 5,
	},

	LARGE_PACK: {
		name: "Large Pack",
		price: 29.99,
		priceId: "pri_large_pack_id",
		description: "20 hours of transcription",
		hours: 20,
	},
};

export function getPlan(planKey: string): PricingPlan | undefined {
	return PRICING_PLANS[planKey.toUpperCase()];
}

export function getSubscriptionPlans(): PricingPlan[] {
	return Object.values(PRICING_PLANS).filter((plan) => plan.priceId !== null);
}
