"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { SafeAuthButtons } from "./safe-auth-buttons";
import { useUser } from "@clerk/nextjs";

export function SiteHeader() {
	const [scrolled, setScrolled] = useState(false);
	const { isSignedIn } = useUser();
	useEffect(() => {
		const onScroll = () => {
			setScrolled(window.scrollY > 4);
		};
		onScroll();
		window.addEventListener("scroll", onScroll, { passive: true });
		return () => window.removeEventListener("scroll", onScroll);
	}, []);

	return (
		<header
			className={`sticky top-0 z-50 bg-white/80 backdrop-blur ${scrolled ? "border-b shadow-sm" : ""}`}
		>
			<div className="container mx-auto px-4 lg:px-6 h-16 flex items-center">
				<div className="flex items-center gap-2 shrink-0">
					<Link href="/" className="flex items-center gap-2">
						<span className="font-bold text-xl">AudioScribe</span>
					</Link>
				</div>

				<nav className="hidden md:flex flex-1 items-center gap-8 justify-start m-8">
					<Link
						href="/features"
						className="text-sm text-gray-700 hover:text-gray-900 transition-colors"
					>
						Features
					</Link>
					<Link
						href="/pricing"
						className="text-sm text-gray-700 hover:text-gray-900 transition-colors"
					>
						Pricing
					</Link>
					<Link
						href="/about"
						className="text-sm text-gray-700 hover:text-gray-900 transition-colors"
					>
						About
					</Link>
					<Link
						href="/contact"
						className="text-sm text-gray-700 hover:text-gray-900 transition-colors"
					>
						Contact
					</Link>
				</nav>



				<div className="ml-auto flex items-center gap-4">
					<Link
						href="/dashboard"
						className="text-sm text-gray-700 hover:text-gray-900 transition-colors"
					>
						Dashboard
					</Link>
					{isSignedIn && (
						<>
							<Link href="/subscription" className="text-sm text-gray-700 hover:text-gray-900 transition-colors">
								Subscription
							</Link>
						</>
					)}
					<SafeAuthButtons />
				</div>
			</div>
		</header>
	);
}
