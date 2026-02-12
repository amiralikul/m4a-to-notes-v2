const LOG_LEVELS = {
	ERROR: 0,
	WARN: 1,
	INFO: 2,
	DEBUG: 3,
} as const;

type LogLevel = keyof typeof LOG_LEVELS;
type LogMeta = Record<string, unknown>;

class Logger {
	private level: number;

	constructor(level: LogLevel = "INFO") {
		this.level = LOG_LEVELS[level] || LOG_LEVELS.INFO;
	}

	private formatMessage(
		level: LogLevel,
		message: string,
		meta: LogMeta = {},
	): Record<string, unknown> {
		return {
			timestamp: new Date().toISOString(),
			level,
			message,
			...meta,
		};
	}

	private log(level: LogLevel, message: string, meta: LogMeta = {}): void {
		if (LOG_LEVELS[level] <= this.level) {
			const logEntry = this.formatMessage(level, message, meta);
			console.log(JSON.stringify(logEntry, null, 2));
		}
	}

	error(message: string, meta: LogMeta = {}): void {
		this.log("ERROR", message, meta);
	}

	warn(message: string, meta: LogMeta = {}): void {
		this.log("WARN", message, meta);
	}

	info(message: string, meta: LogMeta = {}): void {
		this.log("INFO", message, meta);
	}

	debug(message: string, meta: LogMeta = {}): void {
		this.log("DEBUG", message, meta);
	}
}

export { Logger };
export type { LogLevel, LogMeta };

// Singleton export (#16)
export const logger = new Logger(
	(process.env.LOG_LEVEL as LogLevel) || "INFO",
);
