import type { Metadata } from "next";
import { DM_Sans, Instrument_Serif, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { LemonSqueezyProvider } from "@/components/lemonsqueezy-provider";
import { QueryProvider } from "@/components/query-provider";
import { SiteHeader } from "@/components/site-header";

const dmSans = DM_Sans({
	subsets: ["latin"],
	variable: "--font-dm-sans",
});

const instrumentSerif = Instrument_Serif({
	weight: "400",
	style: ["normal", "italic"],
	subsets: ["latin"],
	variable: "--font-instrument-serif",
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "AudioScribe - Audio to Text Transcription",
	description:
		"Convert your audio files to accurate text transcriptions using AI-powered speech recognition.",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<ClerkProvider
			appearance={{
				baseTheme: undefined,
				variables: {
					colorPrimary: "#1c1917",
					colorText: "#1c1917",
					colorBackground: "#fafaf9",
					borderRadius: "0.75rem",
					fontFamily: "var(--font-dm-sans)",
				},
				elements: {
					modalBackdrop: "bg-stone-950/30 backdrop-blur-sm",
					card: "shadow-xl border border-stone-200 rounded-2xl",
					headerTitle: "text-stone-900",
					headerSubtitle: "text-stone-600",
					formFieldLabel: "text-sm text-stone-700",
					formFieldInput:
						"h-11 rounded-xl border-stone-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500",
					formFieldHintText: "text-xs text-stone-500",
					formButtonPrimary:
						"bg-stone-900 hover:bg-stone-800 text-white rounded-full h-11 px-5 transition-colors",
					formButtonReset: "text-stone-600 hover:text-stone-900",
					footerActionText: "text-stone-600",
					footerActionLink: "text-amber-600 hover:text-amber-700",
					socialButtons: "hidden",
				},
			}}
		>
			<html lang="en">
				<body
					className={`${dmSans.variable} ${instrumentSerif.variable} ${geistMono.variable} antialiased`}
				>
					<QueryProvider>
						<LemonSqueezyProvider>
							<SiteHeader />
							{children}
						</LemonSqueezyProvider>
					</QueryProvider>
				</body>
			</html>
		</ClerkProvider>
	);
}
