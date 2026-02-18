export const TRIAL_ERROR_CODES = {
	DAILY_LIMIT_REACHED: "TRIAL_DAILY_LIMIT_REACHED",
} as const;

export type TrialErrorCode =
	(typeof TRIAL_ERROR_CODES)[keyof typeof TRIAL_ERROR_CODES];
