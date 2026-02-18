import Link from "next/link";

export const SiteFooter = () => {
	return (
		<footer className="bg-stone-950 text-stone-400">
			<div className="container px-4 md:px-6 py-16">
				<div className="grid grid-cols-1 md:grid-cols-4 gap-10">
					<div className="md:col-span-2">
						<Link
							href="/"
							className="inline-flex items-center gap-2.5 mb-4"
						>
							<div className="w-8 h-8 rounded-lg bg-stone-800 flex items-center justify-center">
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
									<path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
									<path d="M19 10v2a7 7 0 0 1-14 0v-2" />
									<line x1="12" x2="12" y1="19" y2="22" />
								</svg>
							</div>
							<span className="font-display text-xl italic text-stone-200">
								AudioScribe
							</span>
						</Link>
						<p className="text-stone-500 leading-relaxed max-w-sm">
							Transform audio files into accurate text with
							AI-powered transcription. Simple, secure,
							professional.
						</p>
					</div>

					<div>
						<h4 className="font-semibold mb-4 text-stone-200 text-sm uppercase tracking-wider">
							Product
						</h4>
						<nav className="flex flex-col space-y-3">
							<Link
								href="/features"
								className="text-sm text-stone-500 hover:text-stone-200 transition-colors"
							>
								Features
							</Link>
							<Link
								href="/pricing"
								className="text-sm text-stone-500 hover:text-stone-200 transition-colors"
							>
								Pricing
							</Link>
							<Link
								href="/dashboard"
								className="text-sm text-stone-500 hover:text-stone-200 transition-colors"
							>
								Dashboard
							</Link>
						</nav>
					</div>

					<div>
						<h4 className="font-semibold mb-4 text-stone-200 text-sm uppercase tracking-wider">
							Support
						</h4>
						<nav className="flex flex-col space-y-3">
							<Link
								href="/contact"
								className="text-sm text-stone-500 hover:text-stone-200 transition-colors"
							>
								Contact Us
							</Link>
							<Link
								href="/about"
								className="text-sm text-stone-500 hover:text-stone-200 transition-colors"
							>
								About
							</Link>
						</nav>
					</div>
				</div>

				<div className="border-t border-stone-800/60 mt-12 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
					<p className="text-sm text-stone-600">
						&copy; {new Date().getFullYear()} AudioScribe
					</p>
					<nav className="flex gap-6">
						<Link
							href="/terms"
							className="text-sm text-stone-600 hover:text-stone-400 transition-colors"
						>
							Terms
						</Link>
						<Link
							href="/privacy"
							className="text-sm text-stone-600 hover:text-stone-400 transition-colors"
						>
							Privacy
						</Link>
					</nav>
				</div>
			</div>
		</footer>
	);
};
