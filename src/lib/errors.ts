export class AppError extends Error {
	public readonly statusCode: number;
	public readonly isOperational: boolean;

	constructor(
		message: string,
		statusCode: number = 500,
		isOperational: boolean = true,
	) {
		super(message);
		this.name = this.constructor.name;
		this.statusCode = statusCode;
		this.isOperational = isOperational;

		Error.captureStackTrace(this, this.constructor);
	}
}

export class ValidationError extends AppError {
	constructor(message: string) {
		super(message, 400);
	}
}

export class NotFoundError extends AppError {
	constructor(message: string = "Resource not found") {
		super(message, 404);
	}
}

export class UnauthorizedError extends AppError {
	constructor(message: string = "Unauthorized access") {
		super(message, 401);
	}
}

export class TelegramError extends AppError {
	constructor(message: string) {
		super(message, 500);
	}
}

export class TranscriptionError extends AppError {
	constructor(message: string) {
		super(message, 500);
	}
}

export class StorageError extends AppError {
	constructor(message: string) {
		super(message, 500);
	}
}

export function isAppError(error: unknown): error is AppError {
	return error instanceof AppError;
}

export function isError(error: unknown): error is Error {
	return error instanceof Error;
}

export function getErrorMessage(error: unknown): string {
	if (isAppError(error) || isError(error)) {
		return error.message;
	}
	if (typeof error === "string") {
		return error;
	}
	return "An unknown error occurred";
}

export function getErrorStatusCode(error: unknown): number {
	if (isAppError(error)) {
		return error.statusCode;
	}
	return 500;
}
