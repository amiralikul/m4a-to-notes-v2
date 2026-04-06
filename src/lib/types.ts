// Lemon Squeezy webhook types
export interface LemonSqueezyWebhook {
	meta: {
		event_name: string;
		custom_data?: Record<string, string>;
	};
	data: {
		id: string;
		type: string;
		attributes: LemonSqueezySubscriptionAttributes;
		relationships: Record<string, unknown>;
	};
}

export interface LemonSqueezySubscriptionAttributes {
	store_id: number;
	customer_id: number;
	order_id: number;
	product_id: number;
	variant_id: number;
	product_name: string;
	variant_name: string;
	user_name: string;
	user_email: string;
	status: string;
	status_formatted: string;
	cancelled: boolean;
	renews_at: string | null;
	ends_at: string | null;
	trial_ends_at: string | null;
	urls: {
		update_payment_method: string;
		customer_portal: string;
		customer_portal_update_subscription: string;
	};
	first_subscription_item: {
		id: number;
		subscription_id: number;
		price_id: number;
		quantity: number;
	} | null;
	created_at: string;
	updated_at: string;
	test_mode: boolean;
}

// Storage service types
export interface UploadResult {
	key: string;
	url: string;
}

// Error types
export interface ApiError {
	error: string;
	requestId?: string;
	details?: unknown;
}

// User entitlements types
export interface UserEntitlements {
	userId: string;
	plan?: string;
	status?: string;
	expiresAt?: string;
	features: string[];
	limits: {
		dailyTranscriptions?: number;
		maxFileSize?: number;
	};
}

// Log metadata type
export type LogMeta = Record<string, unknown>;
