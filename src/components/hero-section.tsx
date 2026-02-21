import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const WAVEFORM_HEIGHTS = [
	35, 55, 40, 70, 50, 85, 45, 90, 55, 75, 40, 65, 50, 80, 45, 70, 35, 60,
	50, 75, 40, 85, 55, 65, 45, 70, 50, 60, 40, 55,
];

export const HeroSection = () => {
	return (
		<section className="relative w-full py-24 md:py-36 lg:py-44 overflow-hidden bg-gradient-to-b from-emerald-50 via-teal-50/60 to-stone-50">
			{/* Primary sage glow - center */}
			<div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-emerald-200/40 rounded-full blur-3xl" />
			{/* Secondary glow - top right coolness */}
			<div className="absolute -top-20 right-0 w-[500px] h-[400px] bg-teal-100/40 rounded-full blur-3xl" />
			{/* Tertiary glow - bottom left mint */}
			<div className="absolute bottom-0 -left-20 w-[400px] h-[300px] bg-emerald-100/30 rounded-full blur-3xl" />

			{/* Grid pattern */}
			<div
				className="absolute inset-0"
				style={{
					backgroundImage: `linear-gradient(to right, rgb(16 185 129 / 0.15) 1px, transparent 1px), linear-gradient(to bottom, rgb(16 185 129 / 0.15) 1px, transparent 1px)`,
					backgroundSize: "40px 40px",
				}}
			/>

			<div className="container px-4 md:px-6 relative z-10">
				<div className="flex flex-col items-center space-y-8 text-center max-w-4xl mx-auto">
					{/* Badge */}
					<div className="inline-flex items-center gap-2 bg-emerald-100 border border-emerald-200 rounded-full px-4 py-1.5 text-emerald-700 text-sm">
						<span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
						AI-Powered Transcription
					</div>

					{/* Heading */}
					<h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl tracking-tight text-stone-900">
						<span className="font-display italic">
							Convert audio to text,
						</span>
						<br />
						<span className="text-emerald-600 font-display italic">
							effortlessly.
						</span>
					</h1>

					{/* Subtitle */}
					<p className="max-w-2xl text-lg md:text-xl text-stone-500 leading-relaxed">
						Transform your audio recordings into accurate text in
						minutes. Built for meetings, interviews, podcasts, and
						voice memos.
					</p>

					{/* CTA */}
					<div className="flex flex-col sm:flex-row gap-4 pt-4">
						<Button
							size="lg"
							className="bg-amber-500 hover:bg-amber-600 text-stone-950 font-semibold h-12 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all"
							asChild
						>
							<Link href="/dashboard">
								Start Transcribing Free
								<ArrowRight className="ml-2 h-4 w-4" />
							</Link>
						</Button>
					</div>

					{/* Trust indicators */}
					<div className="flex flex-wrap justify-center items-center gap-6 pt-4 text-sm text-stone-400">
						<span>No credit card required</span>
						<span className="w-1 h-1 bg-stone-300 rounded-full hidden sm:block" />
						<span>3 free transcriptions/day</span>
						<span className="w-1 h-1 bg-stone-300 rounded-full hidden sm:block" />
						<span>Files auto-deleted</span>
					</div>

					{/* Decorative waveform */}
					<div className="flex items-end gap-[3px] h-16 pt-8 opacity-15">
						{WAVEFORM_HEIGHTS.map((h, i) => (
							<div
								key={i}
								className="w-[3px] bg-emerald-400 rounded-full"
								style={{ height: `${h}%` }}
							/>
						))}
					</div>
				</div>
			</div>
		</section>
	);
};
