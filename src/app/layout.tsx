import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { PaddleProvider } from "@/components/paddle-provider";
import { SiteHeader } from "@/components/site-header";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "AudioScribe - M4A to Text Transcription",
	description:
		"Convert your M4A audio files to accurate text transcriptions using AI-powered speech recognition.",
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
					colorPrimary: "#6c47ff",
					colorText: "#111827",
					colorBackground: "#ffffff",
					borderRadius: "0.75rem",
					fontFamily: "var(--font-geist-sans)",
				},
				elements: {
					modalBackdrop: "bg-black/30 backdrop-blur-sm",
					card: "shadow-xl border border-gray-200 rounded-2xl",
					headerTitle: "text-gray-900",
					headerSubtitle: "text-gray-600",
					formFieldLabel: "text-sm text-gray-700",
					formFieldInput:
						"h-11 rounded-xl border-gray-300 focus:ring-2 focus:ring-[#6c47ff] focus:border-[#6c47ff]",
					formFieldHintText: "text-xs text-gray-500",
					formButtonPrimary:
						"bg-[#6c47ff] hover:bg-[#5a3ee6] text-white rounded-full h-11 px-5 transition-colors",
					formButtonReset: "text-gray-600 hover:text-gray-900",
					footerActionText: "text-gray-600",
					footerActionLink: "text-[#6c47ff] hover:text-[#5a3ee6]",
					socialButtons: "hidden",
				},
			}}
		>
			<html lang="en">
				<body
					className={`${geistSans.variable} ${geistMono.variable} antialiased`}
				>
					<PaddleProvider>
						<SiteHeader />
						{children}
					</PaddleProvider>
				</body>
			</html>
		</ClerkProvider>
	);
}
