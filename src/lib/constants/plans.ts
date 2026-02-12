export const SUBSCRIPTION_PLANS = {
	FREE: "free",
	PRO: "pro",
	BUSINESS: "business",
} as const;

export const SUBSCRIPTION_STATUS = {
	NONE: "none",
	ACTIVE: "active",
	TRIALING: "trialing",
	PAST_DUE: "past_due",
	CANCELED: "canceled",
} as const;

export const PADDLE_STATUS = {
	ACTIVE: "active",
	TRIALING: "trialing",
	PAST_DUE: "past_due",
	CANCELED: "canceled",
} as const;

export const SUBSCRIPTION_PROVIDERS = {
	PADDLE: "paddle",
} as const;

export const PADDLE_PRICE_IDS = {
	PRO_MONTHLY: "pri_01k399jhfp27dnef4eah1z28y2",
} as const;

export const PLAN_HIERARCHY: Record<string, number> = {
	[SUBSCRIPTION_PLANS.FREE]: 0,
	[SUBSCRIPTION_PLANS.PRO]: 1,
	[SUBSCRIPTION_PLANS.BUSINESS]: 2,
};

export const WEBHOOK_EVENT_TYPES = {
	SUBSCRIPTION_CREATED: "subscription.created",
	SUBSCRIPTION_UPDATED: "subscription.updated",
	SUBSCRIPTION_CANCELED: "subscription.canceled",
	TRANSACTION_COMPLETED: "transaction.completed",
} as const;

export function mapPaddleStatus(paddleStatus: string): string {
	const status = paddleStatus?.toLowerCase();

	switch (status) {
		case PADDLE_STATUS.ACTIVE:
			return SUBSCRIPTION_STATUS.ACTIVE;
		case PADDLE_STATUS.TRIALING:
			return SUBSCRIPTION_STATUS.TRIALING;
		case PADDLE_STATUS.PAST_DUE:
			return SUBSCRIPTION_STATUS.PAST_DUE;
		case PADDLE_STATUS.CANCELED:
			return SUBSCRIPTION_STATUS.CANCELED;
		default:
			return SUBSCRIPTION_STATUS.NONE;
	}
}

export function mapPaddlePriceToPlan(
	priceId: string,
	businessPriceId: string,
): string {
	if (priceId === PADDLE_PRICE_IDS.PRO_MONTHLY) {
		return SUBSCRIPTION_PLANS.PRO;
	}
	if (priceId === businessPriceId) {
		return SUBSCRIPTION_PLANS.BUSINESS;
	}
	if (priceId) {
		return SUBSCRIPTION_PLANS.PRO;
	}

	return SUBSCRIPTION_PLANS.FREE;
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
	entitlements: { meta?: { scheduledChange?: { action: string; effectiveAt: string } } } | null,
): ScheduledCancellation | null {
	const meta = entitlements?.meta;

	if (!meta?.scheduledChange) {
		return null;
	}

	const { action, effectiveAt } = meta.scheduledChange;

	if (action === "cancel" && effectiveAt) {
		const effectiveDate = new Date(effectiveAt);
		const now = new Date();

		if (effectiveDate > now) {
			return {
				isScheduled: true,
				effectiveAt,
				effectiveDate,
				daysUntilCancellation: Math.ceil(
					(effectiveDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
				),
			};
		}
	}

	return null;
}

export function formatScheduledCancellationMessage(
	entitlements: { meta?: { scheduledChange?: { action: string; effectiveAt: string } } } | null,
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
