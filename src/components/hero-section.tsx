"use client";

import { useClerk } from "@clerk/nextjs";
import { CheckCircle, Sparkles, Star, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const HeroSection = () => {
	const { openSignIn, openSignUp } = useClerk();
	return (
		<section className="relative w-full py-20 md:py-32 lg:py-40 overflow-hidden">
			{/* Background Elements (no motion) */}
			<div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 via-indigo-600/5 to-purple-600/10"></div>
			<div className="absolute top-1/4 left-1/4 w-72 h-72 bg-blue-400/10 rounded-full blur-3xl"></div>
			<div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl"></div>

			<div className="container px-4 md:px-6 relative z-10">
				<div className="flex flex-col items-center space-y-8 text-center">
					<div className="space-y-6">
						<Badge
							variant="secondary"
							className="mb-4 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 border-blue-200"
						>
							<Sparkles className="w-3 h-3 mr-1" />
							AI-Powered Transcription
						</Badge>
						<h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl max-w-5xl">
							Convert M4A Files to Text
							<span className="block bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent mt-2">
								Instantly & Accurately
							</span>
						</h1>
						<p className="mx-auto max-w-2xl text-lg md:text-xl text-gray-600 leading-relaxed">
							Transform your M4A audio recordings into accurate text
							transcriptions in minutes. Perfect for meetings, interviews,
							podcasts, and voice memos.
						</p>
					</div>

					<div className="flex flex-col sm:flex-row gap-4 pt-4">
						<Button
							size="lg"
							className="btn-gradient h-14 px-8 rounded-xl"
							onClick={() => openSignUp()}
						>
							<Upload className="mr-2 h-5 w-5" />
							Start Converting Now
						</Button>
					</div>

					<div className="flex flex-wrap justify-center gap-6 text-sm text-gray-600 pt-4">
						<div className="flex items-center bg-white/60 px-4 py-2 rounded-full shadow-sm">
							<CheckCircle className="mr-2 h-4 w-4 text-emerald-500" />
							Free for first 30 minutes
						</div>
						<div className="flex items-center bg-white/60 px-4 py-2 rounded-full shadow-sm">
							<CheckCircle className="mr-2 h-4 w-4 text-emerald-500" />
							Privacy guaranteed
						</div>
					</div>
				</div>
			</div>
		</section>
	);
};
