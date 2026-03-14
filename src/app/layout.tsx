import type { Metadata } from "next";
import { DM_Sans, Instrument_Serif, Geist_Mono } from "next/font/google";
import "./globals.css";
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
	);
}
