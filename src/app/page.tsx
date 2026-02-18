import {
	ArrowRight,
	Clock,
	Download,
	Shield,
	Type,
	Upload,
	Zap,
} from "lucide-react";
import Link from "next/link";
import { HeroSection } from "@/components/hero-section";
import { PricingSection } from "@/components/pricing-section";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";

const STEPS = [
	{
		step: "01",
		title: "Upload",
		desc: "Drag and drop your M4A audio file or click to browse. Files up to 25MB supported.",
		icon: Upload,
	},
	{
		step: "02",
		title: "Process",
		desc: "Our AI analyzes your audio with industry-leading accuracy and real-time progress tracking.",
		icon: Zap,
	},
	{
		step: "03",
		title: "Download",
		desc: "Get your transcription as clean, formatted text. Copy or download as a TXT file.",
		icon: Download,
	},
];

const FEATURES = [
	{
		icon: Clock,
		title: "Lightning Fast",
		desc: "Convert hours of audio to text in minutes with optimized Whisper processing. Real-time progress tracking keeps you informed.",
	},
	{
		icon: Type,
		title: "High Accuracy",
		desc: "95%+ accuracy rate with support for multiple languages and accents. Professional-quality transcriptions every time.",
	},
	{
		icon: Shield,
		title: "Secure & Private",
		desc: "Files encrypted in transit and at rest. Automatically deleted after processing. Your data stays yours.",
	},
];

export default function HomePage() {
	return (
		<div className="flex flex-col min-h-screen">
			<main className="flex-1">
				<HeroSection />

				{/* How It Works */}
				<section className="w-full py-24 md:py-32 bg-stone-50">
					<div className="container px-4 md:px-6">
						<div className="text-center mb-16">
							<p className="text-sm font-medium text-amber-600 uppercase tracking-wider mb-3">
								Simple Process
							</p>
							<h2 className="text-3xl sm:text-4xl md:text-5xl font-display italic text-stone-900">
								Three steps to your transcript
							</h2>
						</div>

						<div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-3">
							{STEPS.map(({ step, title, desc, icon: Icon }) => (
								<div
									key={step}
									className="relative p-8 rounded-2xl bg-white border border-stone-200/60 shadow-sm hover:shadow-md transition-shadow"
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

				{/* Features */}
				<section className="w-full py-24 md:py-32 bg-white">
					<div className="container px-4 md:px-6">
						<div className="text-center mb-16">
							<p className="text-sm font-medium text-amber-600 uppercase tracking-wider mb-3">
								Why AudioScribe
							</p>
							<h2 className="text-3xl sm:text-4xl md:text-5xl font-display italic text-stone-900">
								Built for accuracy &amp; speed
							</h2>
						</div>

						<div className="mx-auto max-w-5xl grid gap-16 lg:grid-cols-2 items-center">
							<div className="space-y-10">
								{FEATURES.map(
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

							{/* Demo card */}
							<div className="relative">
								<div className="absolute -inset-4 bg-amber-500/5 rounded-3xl blur-2xl" />
								<div className="relative bg-stone-950 rounded-2xl p-8 text-stone-300 shadow-2xl">
									<div className="flex items-center gap-3 mb-6">
										<div className="w-3 h-3 rounded-full bg-stone-700" />
										<div className="w-3 h-3 rounded-full bg-stone-700" />
										<div className="w-3 h-3 rounded-full bg-stone-700" />
										<span className="ml-auto text-xs text-stone-600 font-mono">
											meeting-recording.m4a
										</span>
									</div>

									<div className="space-y-4">
										<div className="flex items-center gap-3">
											<div className="h-1.5 flex-1 bg-stone-800 rounded-full overflow-hidden">
												<div className="h-full w-3/4 bg-gradient-to-r from-amber-500 to-amber-400 rounded-full" />
											</div>
											<span className="text-xs text-amber-400 font-mono">
												75%
											</span>
										</div>

										<div className="bg-stone-900/80 rounded-xl p-4 border border-stone-800">
											<p className="text-sm text-stone-400 leading-relaxed italic">
												&ldquo;Good morning everyone,
												let&rsquo;s start today&rsquo;s
												meeting by reviewing the
												quarterly results and discussing
												our upcoming product launch
												strategy...&rdquo;
											</p>
										</div>

										<div className="flex items-center gap-4 text-xs text-stone-600">
											<span>2.3 MB</span>
											<span>15:42 duration</span>
											<span className="text-amber-500">
												Processing...
											</span>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</section>

				{/* Pricing Section */}
				<PricingSection />

				{/* CTA */}
				<section className="w-full py-24 md:py-32 bg-stone-950 relative overflow-hidden">
					<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-amber-500/5 rounded-full blur-3xl" />
					<div className="container px-4 md:px-6 relative z-10">
						<div className="flex flex-col items-center space-y-8 text-center max-w-3xl mx-auto">
							<h2 className="text-3xl sm:text-4xl md:text-5xl font-display italic text-stone-50">
								Ready to get started?
							</h2>
							<p className="text-lg text-stone-400 leading-relaxed">
								Start with 3 free transcriptions. No credit card
								required. Upgrade anytime for unlimited access.
							</p>
							<Button
								size="lg"
								className="bg-amber-500 hover:bg-amber-600 text-stone-950 font-semibold h-12 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all"
								asChild
							>
								<Link href="/dashboard">
									Try AudioScribe Free
									<ArrowRight className="ml-2 h-4 w-4" />
								</Link>
							</Button>
						</div>
					</div>
				</section>
			</main>

			<SiteFooter />
		</div>
	);
}
