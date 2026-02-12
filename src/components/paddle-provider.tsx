"use client";

import type { Environments, Paddle } from "@paddle/paddle-js";
import { initializePaddle } from "@paddle/paddle-js";
import { createContext, useContext, useEffect, useState } from "react";

interface PaddleContextValue {
	paddle: Paddle | null;
	isLoading: boolean;
	error: string | null;
}

const PaddleContext = createContext<PaddleContextValue | null>(null);

export function PaddleProvider({ children }: { children: React.ReactNode }) {
	const [paddle, setPaddle] = useState<Paddle | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const environment = process.env.NEXT_PUBLIC_PADDLE_ENV;
		const token = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN;

		if (!environment || !token) {
			setError("Paddle environment variables not configured");
			setIsLoading(false);
			return;
		}

		initializePaddle({
			environment: environment as Environments,
			token,
		})
			.then((paddleInstance) => {
				if (paddleInstance) {
					setPaddle(paddleInstance);
				} else {
					setError("Failed to initialize Paddle");
				}
				setIsLoading(false);
			})
			.catch((err: unknown) => {
				setError(`Failed to initialize Paddle: ${err instanceof Error ? err.message : String(err)}`);
				setIsLoading(false);
			});
	}, []);

	return (
		<PaddleContext.Provider value={{ paddle, isLoading, error }}>
			{children}
		</PaddleContext.Provider>
	);
}

export function usePaddle(): PaddleContextValue {
	const context = useContext(PaddleContext);
	if (!context) {
		throw new Error("usePaddle must be used within a PaddleProvider");
	}
	return context;
}
