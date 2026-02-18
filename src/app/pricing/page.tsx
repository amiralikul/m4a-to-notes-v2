"use client";

import {
	ArrowRight,
	Building,
	CheckCircle,
	Users,
	Zap,
} from "lucide-react";
import Link from "next/link";
import { PricingSection } from "@/components/pricing-section";
import { Button } from "@/components/ui/button";

const USE_CASES = [
	{
		icon: Users,
		title: "For Individuals",
		desc: "Perfect for journalists, students, researchers, and content creators who need accurate transcriptions for personal projects.",
		features: ["Meeting recordings", "Interview transcripts", "Voice memos"],
	},
	{
		icon: Zap,
		title: "For Teams",
		desc: "Ideal for small to medium teams that need reliable transcription services with unlimited access.",
		features: [
			"Unlimited transcriptions",
			"Shared access",
			"Secure file handling",
		],
	},
	{
		icon: Building,
		title: "For Enterprise",
		desc: "Have specific needs for your organization? Get in touch and we'll work with you on a solution.",
		features: [
			"Unlimited transcriptions",
			"Secure file handling",
			"Contact us for details",
		],
	},
];

const FAQS = [
	{
		question: "What happens if I exceed my plan limits?",
		answer:
			"When you approach your limits, we'll notify you with options to upgrade or purchase additional credits. Your service won't be interrupted, but additional usage will be billed at standard rates.",
	},
	{
		question: "Can I change plans at any time?",
		answer:
			"Yes! You can upgrade or downgrade your plan at any time. Changes are prorated, and you'll only pay for the difference. Downgrades take effect at your next billing cycle.",
	},
	{
		question: "Is my data secure?",
		answer:
			"Absolutely. All files are encrypted in transit and at rest. We automatically delete files after 24 hours, and we never use your data for training or any other purposes. Your privacy is our priority.",
	},
	{
		question: "Do you offer refunds?",
		answer:
			"You can cancel your subscription at any time. Your access will continue until the end of your current billing period. No questions asked.",
	},
];

export default function PricingPage() {
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
							Simple Pricing
						</div>

						<h1 className="text-4xl sm:text-5xl md:text-6xl tracking-tight text-stone-900">
							<span className="font-display italic">
								Choose the perfect plan
							</span>
							<br />
							<span className="text-emerald-600 font-display italic">
								for your needs
							</span>
						</h1>

						<p className="max-w-2xl text-lg md:text-xl text-stone-500 leading-relaxed">
							Transparent pricing with no hidden fees. Start free
							and upgrade as you grow.
						</p>

						<div className="flex flex-wrap justify-center items-center gap-6 pt-4 text-sm text-stone-400">
							<span className="flex items-center gap-2">
								<CheckCircle className="h-4 w-4 text-emerald-500" />
								Secure file handling
							</span>
							<span className="flex items-center gap-2">
								<CheckCircle className="h-4 w-4 text-emerald-500" />
								Cancel anytime
							</span>
							<span className="flex items-center gap-2">
								<CheckCircle className="h-4 w-4 text-emerald-500" />
								No setup fees
							</span>
						</div>
					</div>
				</div>
			</section>

			{/* Pricing Section */}
			<PricingSection />

			{/* Features Comparison */}
			<section className="w-full py-24 md:py-32 bg-white">
				<div className="container px-4 md:px-6">
					<div className="text-center mb-16">
						<p className="text-sm font-medium text-amber-600 uppercase tracking-wider mb-3">
							Feature Comparison
						</p>
						<h2 className="text-3xl sm:text-4xl md:text-5xl font-display italic text-stone-900">
							What&apos;s included in each plan
						</h2>
					</div>

					{/* Features Table */}
					<div className="mx-auto max-w-4xl">
						<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
							<div className="text-left">
								<h3 className="text-lg font-semibold text-stone-900 mb-4">
									Features
								</h3>
							</div>
							<div className="text-center">
								<h3 className="text-lg font-semibold text-stone-900 mb-2">
									Free
								</h3>
								<p className="text-sm text-stone-500">$0/month</p>
							</div>
							<div className="text-center">
								<h3 className="text-lg font-semibold text-stone-900 mb-2">
									Unlimited
								</h3>
								<p className="text-sm text-stone-500">$9.90/month</p>
							</div>
						</div>

						<div className="space-y-4">
							{[
								{
									feature: "Transcriptions",
									free: "3 per month",
									pro: "Unlimited",
								},
								{
									feature: "AI-Powered Transcription",
									free: true,
									pro: true,
								},
								{ feature: "Export to TXT", free: true, pro: true },
								{
									feature: "Secure File Handling",
									free: true,
									pro: true,
								},
							].map(({ feature, free, pro }) => (
								<div
									key={feature}
									className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4 border-b border-stone-200"
								>
									<div className="font-medium text-stone-900">
										{feature}
									</div>
									<div className="text-center text-stone-500">
										{typeof free === "boolean" ? (
											<CheckCircle className="h-4 w-4 text-emerald-500 mx-auto" />
										) : (
											free
										)}
									</div>
									<div className="text-center text-stone-500">
										{typeof pro === "boolean" ? (
											<CheckCircle className="h-4 w-4 text-emerald-500 mx-auto" />
										) : (
											pro
										)}
									</div>
								</div>
							))}
						</div>
					</div>
				</div>
			</section>

			{/* Use Cases */}
			<section className="w-full py-24 md:py-32 bg-stone-50">
				<div className="container px-4 md:px-6">
					<div className="text-center mb-16">
						<p className="text-sm font-medium text-amber-600 uppercase tracking-wider mb-3">
							Who it&apos;s for
						</p>
						<h2 className="text-3xl sm:text-4xl md:text-5xl font-display italic text-stone-900">
							Trusted by professionals
						</h2>
					</div>

					<div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-3">
						{USE_CASES.map(
							({ icon: Icon, title, desc, features }) => (
								<div
									key={title}
									className="p-8 rounded-2xl bg-white border border-stone-200/60 shadow-sm"
								>
									<div className="w-12 h-12 rounded-xl bg-stone-900 flex items-center justify-center mb-6">
										<Icon className="h-5 w-5 text-amber-400" />
									</div>
									<h3 className="text-xl font-semibold text-stone-900 mb-3">
										{title}
									</h3>
									<p className="text-stone-500 leading-relaxed mb-4">
										{desc}
									</p>
									<div className="space-y-2 text-sm">
										{features.map((f) => (
											<div
												key={f}
												className="flex items-center text-stone-600"
											>
												<CheckCircle className="mr-2 h-4 w-4 text-emerald-500" />
												{f}
											</div>
										))}
									</div>
								</div>
							),
						)}
					</div>
				</div>
			</section>

			{/* FAQ Section */}
			<section className="w-full py-24 md:py-32 bg-white">
				<div className="container px-4 md:px-6">
					<div className="text-center mb-16">
						<p className="text-sm font-medium text-amber-600 uppercase tracking-wider mb-3">
							FAQ
						</p>
						<h2 className="text-3xl sm:text-4xl md:text-5xl font-display italic text-stone-900">
							Got questions?
						</h2>
					</div>

					<div className="mx-auto max-w-3xl space-y-6">
						{FAQS.map(({ question, answer }) => (
							<div
								key={question}
								className="p-6 rounded-2xl bg-stone-50 border border-stone-200/60"
							>
								<h3 className="text-lg font-semibold text-stone-900 mb-2">
									{question}
								</h3>
								<p className="text-stone-500 leading-relaxed">
									{answer}
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
							Ready to get started?
						</h2>
						<p className="text-lg text-stone-400 leading-relaxed">
							Start with our free plan and experience the power of
							AI-driven transcription today.
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
