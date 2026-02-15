// Telegram types (Grammy provides its own, but these are used in our interfaces)
export interface TelegramUpdate {
	update_id: number;
	message?: TelegramMessage;
}

export interface TelegramMessage {
	message_id: number;
	from?: TelegramUser;
	chat: TelegramChat;
	date: number;
	text?: string;
	audio?: TelegramAudio;
	voice?: TelegramVoice;
	document?: TelegramDocument;
}

export interface TelegramUser {
	id: number;
	is_bot: boolean;
	first_name: string;
	last_name?: string;
	username?: string;
}

export interface TelegramChat {
	id: number;
	type: "private" | "group" | "supergroup" | "channel";
	title?: string;
	username?: string;
	first_name?: string;
	last_name?: string;
}

export interface TelegramAudio {
	file_id: string;
	file_unique_id: string;
	duration: number;
	performer?: string;
	title?: string;
	file_name?: string;
	mime_type?: string;
	file_size?: number;
}

export interface TelegramVoice {
	file_id: string;
	file_unique_id: string;
	duration: number;
	mime_type?: string;
	file_size?: number;
}

export interface TelegramDocument {
	file_id: string;
	file_unique_id: string;
	file_name?: string;
	mime_type?: string;
	file_size?: number;
}

export interface TelegramFile {
	file_id: string;
	file_unique_id: string;
	file_size?: number;
	file_path?: string;
}

// Job related types
export interface JobData {
	id: string;
	userId: string;
	fileName: string;
	status: "pending" | "processing" | "completed" | "failed";
	source: JobSource;
	createdAt: string;
	completedAt?: string;
	transcription?: string;
	error?: string;
}

export enum JobSource {
	TELEGRAM = "telegram",
	API = "api",
}

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
