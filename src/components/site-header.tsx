"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { SafeAuthButtons } from "./safe-auth-buttons";
import { useAuth } from "@/hooks/use-auth";

export function SiteHeader() {
	const [scrolled, setScrolled] = useState(false);
	const { isSignedIn } = useAuth();

	useEffect(() => {
		const onScroll = () => setScrolled(window.scrollY > 4);
		onScroll();
		window.addEventListener("scroll", onScroll, { passive: true });
		return () => window.removeEventListener("scroll", onScroll);
	}, []);

	return (
		<header
			className={`sticky top-0 z-50 transition-all duration-300 ${
				scrolled
					? "bg-white/90 backdrop-blur-md border-b border-stone-200/60 shadow-sm"
					: "bg-transparent"
			}`}
		>
			<div className="container mx-auto px-4 lg:px-6 h-16 flex items-center">
				<Link href="/" className="flex items-center gap-2.5 shrink-0">
					<div className="w-8 h-8 rounded-lg bg-stone-900 flex items-center justify-center">
						<svg
							width="16"
							height="16"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
							className="text-amber-400"
						>
							<path d="M2 12h2" />
							<path d="M6 8v8" />
							<path d="M10 4v16" />
							<path d="M14 6v12" />
							<path d="M18 8v8" />
							<path d="M22 12h-2" />
						</svg>
					</div>
					<span className="font-display text-xl italic text-stone-900">
						WavesToText
					</span>
				</Link>

				<nav className="hidden md:flex flex-1 items-center gap-8 justify-start ml-10">
					<Link
						href="/features"
						className="text-sm text-stone-500 hover:text-stone-900 transition-colors"
					>
						Features
					</Link>
					<Link
						href="/pricing"
						className="text-sm text-stone-500 hover:text-stone-900 transition-colors"
					>
						Pricing
					</Link>
					<Link
						href="/about"
						className="text-sm text-stone-500 hover:text-stone-900 transition-colors"
					>
						About
					</Link>
					<Link
						href="/contact"
						className="text-sm text-stone-500 hover:text-stone-900 transition-colors"
					>
						Contact
					</Link>
				</nav>

				<div className="ml-auto flex items-center gap-4">
					<Link
						href="/dashboard"
						className="text-sm text-stone-500 hover:text-stone-900 transition-colors"
					>
						Dashboard
					</Link>
					{isSignedIn && (
						<Link
							href="/subscription"
							className="text-sm text-stone-500 hover:text-stone-900 transition-colors"
						>
							Subscription
						</Link>
					)}
					<SafeAuthButtons />
				</div>
			</div>
		</header>
	);
}
