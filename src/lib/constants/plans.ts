export const SUBSCRIPTION_PLANS = {
	FREE: "free",
	PRO: "pro",
} as const;

export const SUBSCRIPTION_STATUS = {
	NONE: "none",
	ACTIVE: "active",
	TRIALING: "trialing",
	PAST_DUE: "past_due",
	CANCELED: "canceled",
} as const;

export const LEMON_SQUEEZY_STATUS = {
	ON_TRIAL: "on_trial",
	ACTIVE: "active",
	PAUSED: "paused",
	PAST_DUE: "past_due",
	UNPAID: "unpaid",
	CANCELLED: "cancelled",
	EXPIRED: "expired",
} as const;

export const SUBSCRIPTION_PROVIDERS = {
	LEMON_SQUEEZY: "lemonsqueezy",
} as const;

export const LEMON_SQUEEZY_VARIANT_IDS = {
	PRO_MONTHLY: process.env.LEMONSQUEEZY_PRO_MONTHLY_VARIANT_ID || "",
	PRO_YEARLY: process.env.LEMONSQUEEZY_PRO_YEARLY_VARIANT_ID || "",
} as const;

export const PLAN_HIERARCHY: Record<string, number> = {
	[SUBSCRIPTION_PLANS.FREE]: 0,
	[SUBSCRIPTION_PLANS.PRO]: 1,
};

export const WEBHOOK_EVENT_TYPES = {
	SUBSCRIPTION_CREATED: "subscription_created",
	SUBSCRIPTION_UPDATED: "subscription_updated",
	SUBSCRIPTION_CANCELLED: "subscription_cancelled",
	SUBSCRIPTION_EXPIRED: "subscription_expired",
} as const;

export function mapLemonSqueezyStatus(lsStatus: string): string {
	const status = lsStatus?.toLowerCase();

	switch (status) {
		case LEMON_SQUEEZY_STATUS.ACTIVE:
			return SUBSCRIPTION_STATUS.ACTIVE;
		case LEMON_SQUEEZY_STATUS.ON_TRIAL:
			return SUBSCRIPTION_STATUS.TRIALING;
		case LEMON_SQUEEZY_STATUS.PAST_DUE:
		case LEMON_SQUEEZY_STATUS.UNPAID:
			return SUBSCRIPTION_STATUS.PAST_DUE;
		case LEMON_SQUEEZY_STATUS.CANCELLED:
		case LEMON_SQUEEZY_STATUS.PAUSED:
			return SUBSCRIPTION_STATUS.CANCELED;
		case LEMON_SQUEEZY_STATUS.EXPIRED:
			return SUBSCRIPTION_STATUS.NONE;
		default:
			return SUBSCRIPTION_STATUS.NONE;
	}
}

export function mapLemonSqueezyVariantToPlan(variantId: string): string {
	const proMonthlyId = process.env.LEMONSQUEEZY_PRO_MONTHLY_VARIANT_ID || "";
	const proYearlyId = process.env.LEMONSQUEEZY_PRO_YEARLY_VARIANT_ID || "";

	if (variantId && (variantId === proMonthlyId || variantId === proYearlyId)) {
		return SUBSCRIPTION_PLANS.PRO;
	}

	return SUBSCRIPTION_PLANS.FREE;
}

export function hasActiveAccess(
	status: string,
	endsAt?: string | null,
): boolean {
	if (status === "active" || status === "trialing") return true;
	if (status === "canceled") {
		return !!endsAt && new Date(endsAt) > new Date();
	}
	return false;
}

export function getPlanHierarchyValue(plan: string): number {
	return PLAN_HIERARCHY[plan] || 0;
}

export interface ScheduledCancellation {
	isScheduled: true;
	effectiveAt: string;
	effectiveDate: Date;
	daysUntilCancellation: number;
}

export function getScheduledCancellation(
	entitlements: { meta?: { endsAt?: string } } | null,
): ScheduledCancellation | null {
	const endsAt = entitlements?.meta?.endsAt;

	if (!endsAt) {
		return null;
	}

	const effectiveDate = new Date(endsAt);
	const now = new Date();

	if (effectiveDate > now) {
		return {
			isScheduled: true,
			effectiveAt: endsAt,
			effectiveDate,
			daysUntilCancellation: Math.ceil(
				(effectiveDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
			),
		};
	}

	return null;
}

export function formatScheduledCancellationMessage(
	entitlements: { meta?: { endsAt?: string } } | null,
): string | null {
	const cancellation = getScheduledCancellation(entitlements);

	if (!cancellation) {
		return null;
	}

	const formattedDate = cancellation.effectiveDate.toLocaleDateString(
		"en-US",
		{
			year: "numeric",
			month: "short",
			day: "numeric",
			hour: "numeric",
			minute: "2-digit",
			hour12: true,
		},
	);

	return `Scheduled cancellation\nThis subscription is scheduled to be canceled on ${formattedDate}`;
}
