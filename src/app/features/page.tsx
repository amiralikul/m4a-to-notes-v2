"use client";

import {
	ArrowRight,
	BarChart3,
	CheckCircle,
	Clock,
	Download,
	Globe,
	Settings,
	Shield,
	Type,
	Upload,
	Zap,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const CORE_FEATURES = [
	{
		icon: Clock,
		title: "Lightning Fast Processing",
		desc: "Convert hours of audio to text in minutes with our optimized OpenAI Whisper processing. Real-time progress tracking keeps you informed throughout.",
	},
	{
		icon: Type,
		title: "Industry-Leading Accuracy",
		desc: "95%+ accuracy rate with support for multiple languages and accents. Our advanced AI understands context and delivers professional-quality results.",
	},
	{
		icon: Shield,
		title: "Security & Privacy",
		desc: "Your files are encrypted and automatically deleted after 24 hours. Enterprise-grade security ensures your data remains completely private.",
	},
];

const ADVANCED_FEATURES = [
	{
		icon: Globe,
		title: "Multi-Language Support",
		desc: "Support for over 50 languages with automatic language detection. Perfect for international meetings, interviews, and multilingual content.",
	},
	{
		icon: Settings,
		title: "Flexible Output Formats",
		desc: "Export your transcriptions as plain text. Copy to clipboard or download as a TXT file for easy sharing and editing.",
	},
	{
		icon: BarChart3,
		title: "Usage Analytics",
		desc: "View your transcription history, access past results, and manage your files from a simple dashboard.",
	},
];

const STEPS = [
	{
		step: "01",
		title: "Upload Your M4A File",
		desc: "Simply drag and drop your M4A audio file or click to browse and select from your device. Files up to 25MB supported.",
		icon: Upload,
	},
	{
		step: "02",
		title: "AI Processing",
		desc: "Our AI analyzes your audio using OpenAI Whisper with real-time progress updates for accurate transcription results.",
		icon: Zap,
	},
	{
		step: "03",
		title: "Download & Use",
		desc: "Get your transcription instantly as clean, formatted text. Copy to clipboard or download as a TXT file.",
		icon: Download,
	},
];

export default function FeaturesPage() {
	return (
		<div className="flex flex-col min-h-screen">
			{/* Hero Section */}
			<section className="relative w-full py-24 md:py-36 overflow-hidden bg-gradient-to-b from-emerald-50 via-teal-50/60 to-stone-50">
				<div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-emerald-200/40 rounded-full blur-3xl" />
				<div className="absolute -top-20 right-0 w-[500px] h-[400px] bg-teal-100/40 rounded-full blur-3xl" />
				<div
					className="absolute inset-0"
					style={{
						backgroundImage: `linear-gradient(to right, rgb(16 185 129 / 0.15) 1px, transparent 1px), linear-gradient(to bottom, rgb(16 185 129 / 0.15) 1px, transparent 1px)`,
						backgroundSize: "40px 40px",
					}}
				/>

				<div className="container px-4 md:px-6 relative z-10">
					<div className="flex flex-col items-center space-y-8 text-center max-w-4xl mx-auto">
						<div className="inline-flex items-center gap-2 bg-emerald-100 border border-emerald-200 rounded-full px-4 py-1.5 text-emerald-700 text-sm">
							<span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
							Powerful Features
						</div>

						<h1 className="text-4xl sm:text-5xl md:text-6xl tracking-tight text-stone-900">
							<span className="font-display italic">
								Everything you need for
							</span>
							<br />
							<span className="text-emerald-600 font-display italic">
								perfect transcription
							</span>
						</h1>

						<p className="max-w-2xl text-lg md:text-xl text-stone-500 leading-relaxed">
							Discover the features that make AudioScribe the best
							choice for converting your M4A files to accurate
							text.
						</p>

						<div className="flex flex-col sm:flex-row gap-4 pt-4">
							<Button
								size="lg"
								className="bg-amber-500 hover:bg-amber-600 text-stone-950 font-semibold h-12 px-8 rounded-xl shadow-lg"
								asChild
							>
								<Link href="/dashboard">
									<Upload className="mr-2 h-5 w-5" />
									Try AudioScribe Now
								</Link>
							</Button>
							<Button
								size="lg"
								variant="outline"
								className="h-12 px-8 rounded-xl border-stone-300 text-stone-600 hover:bg-stone-100 hover:text-stone-900"
								asChild
							>
								<Link href="/pricing">View Pricing</Link>
							</Button>
						</div>
					</div>
				</div>
			</section>

			{/* Core Features */}
			<section className="w-full py-24 md:py-32 bg-stone-50">
				<div className="container px-4 md:px-6">
					<div className="text-center mb-16">
						<p className="text-sm font-medium text-amber-600 uppercase tracking-wider mb-3">
							Core Features
						</p>
						<h2 className="text-3xl sm:text-4xl md:text-5xl font-display italic text-stone-900">
							Built for performance &amp; accuracy
						</h2>
					</div>

					<div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-3">
						{CORE_FEATURES.map(({ icon: Icon, title, desc }) => (
							<div
								key={title}
								className="p-8 rounded-2xl bg-white border border-stone-200/60 shadow-sm hover:shadow-md transition-shadow"
							>
								<div className="w-12 h-12 rounded-xl bg-stone-900 flex items-center justify-center mb-6">
									<Icon className="h-5 w-5 text-amber-400" />
								</div>
								<h3 className="text-xl font-semibold text-stone-900 mb-3">
									{title}
								</h3>
								<p className="text-stone-500 leading-relaxed">
									{desc}
								</p>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* Advanced Features */}
			<section className="w-full py-24 md:py-32 bg-white">
				<div className="container px-4 md:px-6">
					<div className="text-center mb-16">
						<p className="text-sm font-medium text-amber-600 uppercase tracking-wider mb-3">
							Advanced Capabilities
						</p>
						<h2 className="text-3xl sm:text-4xl md:text-5xl font-display italic text-stone-900">
							Professional tools for every need
						</h2>
					</div>

					<div className="mx-auto max-w-5xl grid gap-16 lg:grid-cols-2 items-center">
						<div className="space-y-10">
							{ADVANCED_FEATURES.map(
								({ icon: Icon, title, desc }) => (
									<div key={title} className="flex gap-5">
										<div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-200/60 flex items-center justify-center shrink-0">
											<Icon className="h-5 w-5 text-amber-600" />
										</div>
										<div>
											<h3 className="text-lg font-semibold text-stone-900 mb-1.5">
												{title}
											</h3>
											<p className="text-stone-500 leading-relaxed">
												{desc}
											</p>
										</div>
									</div>
								),
							)}
						</div>

						{/* Feature checklist card */}
						<div className="relative">
							<div className="absolute -inset-4 bg-amber-500/5 rounded-3xl blur-2xl" />
							<div className="relative bg-stone-950 rounded-2xl p-8 text-stone-300 shadow-2xl">
								<div className="flex items-center gap-3 mb-6">
									<div className="w-3 h-3 rounded-full bg-stone-700" />
									<div className="w-3 h-3 rounded-full bg-stone-700" />
									<div className="w-3 h-3 rounded-full bg-stone-700" />
									<span className="ml-auto text-xs text-stone-600">
										Advanced Processing
									</span>
								</div>

								<div className="space-y-4">
									{[
										"Language Detection",
										"Audio Upload",
										"Text Export",
										"Progress Tracking",
										"Batch Processing",
									].map((feature) => (
										<div
											key={feature}
											className="flex items-center justify-between py-2 border-b border-stone-800 last:border-0"
										>
											<span className="text-sm text-stone-400">
												{feature}
											</span>
											<CheckCircle className="h-4 w-4 text-amber-400" />
										</div>
									))}
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* How It Works */}
			<section className="w-full py-24 md:py-32 bg-stone-50">
				<div className="container px-4 md:px-6">
					<div className="text-center mb-16">
						<p className="text-sm font-medium text-amber-600 uppercase tracking-wider mb-3">
							Simple Process
						</p>
						<h2 className="text-3xl sm:text-4xl md:text-5xl font-display italic text-stone-900">
							How AudioScribe works
						</h2>
					</div>

					<div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-3">
						{STEPS.map(({ step, title, desc, icon: Icon }) => (
							<div
								key={step}
								className="relative p-8 rounded-2xl bg-white border border-stone-200/60 shadow-sm"
							>
								<span className="text-5xl font-display italic text-stone-200 absolute top-6 right-6">
									{step}
								</span>
								<div className="w-12 h-12 rounded-xl bg-stone-900 flex items-center justify-center mb-6">
									<Icon className="h-5 w-5 text-amber-400" />
								</div>
								<h3 className="text-xl font-semibold text-stone-900 mb-3">
									{title}
								</h3>
								<p className="text-stone-500 leading-relaxed">
									{desc}
								</p>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* CTA Section */}
			<section className="w-full py-24 md:py-32 bg-stone-950 relative overflow-hidden">
				<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-amber-500/5 rounded-full blur-3xl" />
				<div className="container px-4 md:px-6 relative z-10">
					<div className="flex flex-col items-center space-y-8 text-center max-w-3xl mx-auto">
						<h2 className="text-3xl sm:text-4xl md:text-5xl font-display italic text-stone-50">
							Ready to transform your audio?
						</h2>
						<p className="text-lg text-stone-400 leading-relaxed">
							Join professionals who trust AudioScribe for
							accurate, fast transcriptions.
						</p>
						<div className="flex flex-col sm:flex-row gap-4 pt-4">
							<Button
								size="lg"
								className="bg-amber-500 hover:bg-amber-600 text-stone-950 font-semibold h-12 px-8 rounded-xl shadow-lg"
								asChild
							>
								<Link href="/dashboard">
									Start Free Trial
									<ArrowRight className="ml-2 h-4 w-4" />
								</Link>
							</Button>
							<Button
								size="lg"
								variant="outline"
								className="h-12 px-8 rounded-xl border-stone-700 text-stone-300 hover:bg-stone-800 hover:text-stone-100"
								asChild
							>
								<Link href="/contact">Contact Sales</Link>
							</Button>
						</div>
					</div>
				</div>
			</section>
		</div>
	);
}
