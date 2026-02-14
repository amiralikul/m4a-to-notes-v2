"use client";

import Script from "next/script";
import { createContext, useCallback, useContext, useState } from "react";

interface LemonSqueezyContextValue {
	isReady: boolean;
	isLoading: boolean;
	error: string | null;
	openCheckout: (url: string) => void;
}

const LemonSqueezyContext = createContext<LemonSqueezyContextValue | null>(null);

declare global {
	interface Window {
		createLemonSqueezy?: () => void;
		LemonSqueezy?: {
			Url: {
				Open: (url: string) => void;
				Close: () => void;
			};
			Setup: (options: { eventHandler: (event: { event: string }) => void }) => void;
		};
	}
}

export function LemonSqueezyProvider({ children }: { children: React.ReactNode }) {
	const [isReady, setIsReady] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const handleScriptLoad = useCallback(() => {
		if (window.createLemonSqueezy) {
			window.createLemonSqueezy();
			setIsReady(true);
		} else {
			setError("Failed to initialize Lemon Squeezy");
		}
		setIsLoading(false);
	}, []);

	const handleScriptError = useCallback(() => {
		setError("Failed to load Lemon Squeezy script");
		setIsLoading(false);
	}, []);

	const openCheckout = useCallback((url: string) => {
		if (window.LemonSqueezy) {
			window.LemonSqueezy.Url.Open(url);
		} else {
			window.open(url, "_blank");
		}
	}, []);

	return (
		<LemonSqueezyContext.Provider value={{ isReady, isLoading, error, openCheckout }}>
			<Script
				src="https://app.lemonsqueezy.com/js/lemon.js"
				strategy="afterInteractive"
				onLoad={handleScriptLoad}
				onError={handleScriptError}
			/>
			{children}
		</LemonSqueezyContext.Provider>
	);
}

export function useLemonSqueezy(): LemonSqueezyContextValue {
	const context = useContext(LemonSqueezyContext);
	if (!context) {
		throw new Error("useLemonSqueezy must be used within a LemonSqueezyProvider");
	}
	return context;
}
