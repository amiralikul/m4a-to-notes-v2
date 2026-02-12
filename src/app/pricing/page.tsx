"use client";

import {
	Award,
	Building,
	CheckCircle,
	Clock,
	Headphones,
	Shield,
	Sparkles,
	Users,
	Zap,
} from "lucide-react";
import Link from "next/link";
import { PricingSection } from "@/components/pricing-section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

export default function PricingPage() {
	return (
		<div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
			{/* Hero Section */}
			<section className="relative w-full py-20 md:py-32 overflow-hidden">
				<div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 via-indigo-600/5 to-purple-600/10"></div>
				<div className="absolute top-1/4 left-1/4 w-72 h-72 bg-blue-400/10 rounded-full blur-3xl animate-pulse"></div>
				<div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl animate-pulse delay-1000"></div>

				<div className="container px-4 md:px-6 relative z-10">
					<div className="flex flex-col items-center space-y-8 text-center">
						<div className="space-y-6">
							<Badge
								variant="secondary"
								className="mb-4 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 border-blue-200"
							>
								<Sparkles className="w-3 h-3 mr-1" />
								Simple Pricing
							</Badge>
							<h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl max-w-5xl">
								Choose the Perfect Plan
								<span className="block bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent mt-2">
									For Your Transcription Needs
								</span>
							</h1>
							<p className="mx-auto max-w-2xl text-lg md:text-xl text-gray-600 leading-relaxed">
								Transparent pricing with no hidden fees. Start free and upgrade
								as you grow. All plans include our core features and 24/7
								support.
							</p>
						</div>

						<div className="flex flex-wrap justify-center gap-4 text-sm text-gray-600 pt-4">
							<div className="flex items-center bg-white/60 px-4 py-2 rounded-full shadow-sm">
								<CheckCircle className="mr-2 h-4 w-4 text-emerald-500" />
								30-day money-back guarantee
							</div>
							<div className="flex items-center bg-white/60 px-4 py-2 rounded-full shadow-sm">
								<CheckCircle className="mr-2 h-4 w-4 text-emerald-500" />
								Cancel anytime
							</div>
							<div className="flex items-center bg-white/60 px-4 py-2 rounded-full shadow-sm">
								<CheckCircle className="mr-2 h-4 w-4 text-emerald-500" />
								No setup fees
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Pricing Section - Reusing existing component */}
			<PricingSection />

			{/* Features Comparison */}
			<section className="w-full py-20 md:py-32 bg-white">
				<div className="container px-4 md:px-6">
					<div className="flex flex-col items-center justify-center space-y-6 text-center mb-16">
						<Badge
							variant="outline"
							className="bg-white border-blue-200 text-blue-700"
						>
							Feature Comparison
						</Badge>
						<h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
							What's Included in Each Plan
						</h2>
						<p className="max-w-2xl text-lg text-gray-600 leading-relaxed">
							All plans include our core transcription technology with varying
							limits and features
						</p>
					</div>

					{/* Features Table */}
					<div className="mx-auto max-w-6xl">
						<div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
							<div className="text-left">
								<h3 className="text-lg font-semibold text-gray-900 mb-4">
									Features
								</h3>
							</div>
							<div className="text-center">
								<h3 className="text-lg font-semibold text-gray-900 mb-2">
									Free
								</h3>
								<p className="text-sm text-gray-600">$0/month</p>
							</div>
							<div className="text-center">
								<h3 className="text-lg font-semibold text-gray-900 mb-2">
									Pro
								</h3>
								<p className="text-sm text-gray-600">$19/month</p>
							</div>
							<div className="text-center">
								<h3 className="text-lg font-semibold text-gray-900 mb-2">
									Business
								</h3>
								<p className="text-sm text-gray-600">$49/month</p>
							</div>
						</div>

						<div className="space-y-4">
							{/* Transcription Minutes */}
							<div className="grid grid-cols-1 md:grid-cols-4 gap-4 py-4 border-b border-gray-200">
								<div className="font-medium text-gray-900">
									Transcription Minutes
								</div>
								<div className="text-center text-gray-600">30 minutes</div>
								<div className="text-center text-gray-600">500 minutes</div>
								<div className="text-center text-gray-600">Unlimited</div>
							</div>

							{/* File Size Limit */}
							<div className="grid grid-cols-1 md:grid-cols-4 gap-4 py-4 border-b border-gray-200">
								<div className="font-medium text-gray-900">Max File Size</div>
								<div className="text-center text-gray-600">25MB</div>
								<div className="text-center text-gray-600">100MB</div>
								<div className="text-center text-gray-600">500MB</div>
							</div>

							{/* Processing Speed */}
							<div className="grid grid-cols-1 md:grid-cols-4 gap-4 py-4 border-b border-gray-200">
								<div className="font-medium text-gray-900">
									Processing Speed
								</div>
								<div className="text-center">
									<Clock className="h-4 w-4 text-yellow-500 mx-auto" />
								</div>
								<div className="text-center">
									<Zap className="h-4 w-4 text-blue-500 mx-auto" />
								</div>
								<div className="text-center">
									<Zap className="h-4 w-4 text-green-500 mx-auto" />
								</div>
							</div>

							{/* Security */}
							<div className="grid grid-cols-1 md:grid-cols-4 gap-4 py-4 border-b border-gray-200">
								<div className="font-medium text-gray-900">
									Enterprise Security
								</div>
								<div className="text-center">
									<CheckCircle className="h-4 w-4 text-green-500 mx-auto" />
								</div>
								<div className="text-center">
									<CheckCircle className="h-4 w-4 text-green-500 mx-auto" />
								</div>
								<div className="text-center">
									<Shield className="h-4 w-4 text-green-500 mx-auto" />
								</div>
							</div>

							{/* Support */}
							<div className="grid grid-cols-1 md:grid-cols-4 gap-4 py-4 border-b border-gray-200">
								<div className="font-medium text-gray-900">Support</div>
								<div className="text-center text-gray-600">Community</div>
								<div className="text-center">
									<Headphones className="h-4 w-4 text-blue-500 mx-auto" />
								</div>
								<div className="text-center">
									<Award className="h-4 w-4 text-purple-500 mx-auto" />
								</div>
							</div>

							{/* API Access */}
							<div className="grid grid-cols-1 md:grid-cols-4 gap-4 py-4">
								<div className="font-medium text-gray-900">API Access</div>
								<div className="text-center text-gray-400">-</div>
								<div className="text-center text-gray-400">-</div>
								<div className="text-center">
									<CheckCircle className="h-4 w-4 text-green-500 mx-auto" />
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Why Choose AudioScribe */}
			<section className="w-full py-20 md:py-32 bg-gradient-to-b from-gray-50 to-white">
				<div className="container px-4 md:px-6">
					<div className="flex flex-col items-center justify-center space-y-6 text-center mb-16">
						<Badge
							variant="outline"
							className="bg-white border-gray-200 text-gray-700"
						>
							Why Choose AudioScribe
						</Badge>
						<h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
							Trusted by Professionals Worldwide
						</h2>
					</div>

					<div className="mx-auto grid max-w-6xl items-start gap-12 lg:grid-cols-3">
						<Card className="text-center border-0 shadow-lg bg-white/80 backdrop-blur-sm">
							<CardHeader className="pb-4">
								<div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg mb-4">
									<Users className="h-8 w-8" />
								</div>
								<CardTitle className="text-xl font-semibold">
									For Individuals
								</CardTitle>
							</CardHeader>
							<CardContent>
								<CardDescription className="text-base text-gray-600 leading-relaxed mb-4">
									Perfect for journalists, students, researchers, and content
									creators who need accurate transcriptions for personal
									projects.
								</CardDescription>
								<div className="space-y-2 text-sm">
									<div className="flex items-center text-gray-600">
										<CheckCircle className="mr-2 h-4 w-4 text-green-500" />
										Meeting recordings
									</div>
									<div className="flex items-center text-gray-600">
										<CheckCircle className="mr-2 h-4 w-4 text-green-500" />
										Interview transcripts
									</div>
									<div className="flex items-center text-gray-600">
										<CheckCircle className="mr-2 h-4 w-4 text-green-500" />
										Voice memos
									</div>
								</div>
							</CardContent>
						</Card>

						<Card className="text-center border-0 shadow-lg bg-white/80 backdrop-blur-sm">
							<CardHeader className="pb-4">
								<div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg mb-4">
									<Zap className="h-8 w-8" />
								</div>
								<CardTitle className="text-xl font-semibold">
									For Teams
								</CardTitle>
							</CardHeader>
							<CardContent>
								<CardDescription className="text-base text-gray-600 leading-relaxed mb-4">
									Ideal for small to medium teams that need reliable
									transcription services with enhanced features and priority
									support.
								</CardDescription>
								<div className="space-y-2 text-sm">
									<div className="flex items-center text-gray-600">
										<CheckCircle className="mr-2 h-4 w-4 text-green-500" />
										Team collaboration
									</div>
									<div className="flex items-center text-gray-600">
										<CheckCircle className="mr-2 h-4 w-4 text-green-500" />
										Higher limits
									</div>
									<div className="flex items-center text-gray-600">
										<CheckCircle className="mr-2 h-4 w-4 text-green-500" />
										Priority processing
									</div>
								</div>
							</CardContent>
						</Card>

						<Card className="text-center border-0 shadow-lg bg-white/80 backdrop-blur-sm">
							<CardHeader className="pb-4">
								<div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 text-white shadow-lg mb-4">
									<Building className="h-8 w-8" />
								</div>
								<CardTitle className="text-xl font-semibold">
									For Enterprise
								</CardTitle>
							</CardHeader>
							<CardContent>
								<CardDescription className="text-base text-gray-600 leading-relaxed mb-4">
									Comprehensive solution for large organizations with unlimited
									usage, API access, and dedicated support.
								</CardDescription>
								<div className="space-y-2 text-sm">
									<div className="flex items-center text-gray-600">
										<CheckCircle className="mr-2 h-4 w-4 text-green-500" />
										API integration
									</div>
									<div className="flex items-center text-gray-600">
										<CheckCircle className="mr-2 h-4 w-4 text-green-500" />
										Custom workflows
									</div>
									<div className="flex items-center text-gray-600">
										<CheckCircle className="mr-2 h-4 w-4 text-green-500" />
										Dedicated support
									</div>
								</div>
							</CardContent>
						</Card>
					</div>
				</div>
			</section>

			{/* FAQ Section */}
			<section className="w-full py-20 md:py-32 bg-white">
				<div className="container px-4 md:px-6">
					<div className="flex flex-col items-center justify-center space-y-6 text-center mb-16">
						<Badge
							variant="outline"
							className="bg-white border-blue-200 text-blue-700"
						>
							Frequently Asked Questions
						</Badge>
						<h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
							Got Questions?
						</h2>
					</div>

					<div className="mx-auto max-w-4xl space-y-8">
						<Card className="border-l-4 border-l-blue-500">
							<CardHeader>
								<CardTitle className="text-lg">
									What happens if I exceed my plan limits?
								</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="text-gray-600">
									When you approach your limits, we'll notify you with options
									to upgrade or purchase additional credits. Your service won't
									be interrupted, but additional usage will be billed at
									standard rates.
								</p>
							</CardContent>
						</Card>

						<Card className="border-l-4 border-l-indigo-500">
							<CardHeader>
								<CardTitle className="text-lg">
									Can I change plans at any time?
								</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="text-gray-600">
									Yes! You can upgrade or downgrade your plan at any time.
									Changes are prorated, and you'll only pay for the difference.
									Downgrades take effect at your next billing cycle.
								</p>
							</CardContent>
						</Card>

						<Card className="border-l-4 border-l-purple-500">
							<CardHeader>
								<CardTitle className="text-lg">Is my data secure?</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="text-gray-600">
									Absolutely. All files are encrypted in transit and at rest. We
									automatically delete files after 24 hours, and we never use
									your data for training or any other purposes. Your privacy is
									our priority.
								</p>
							</CardContent>
						</Card>

						<Card className="border-l-4 border-l-green-500">
							<CardHeader>
								<CardTitle className="text-lg">Do you offer refunds?</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="text-gray-600">
									We offer a 30-day money-back guarantee on all paid plans. If
									you're not satisfied with our service, contact our support
									team for a full refund within the first 30 days.
								</p>
							</CardContent>
						</Card>
					</div>
				</div>
			</section>

			{/* CTA Section */}
			<section className="w-full py-20 md:py-32 bg-gradient-to-r from-blue-600 to-indigo-600">
				<div className="container px-4 md:px-6">
					<div className="flex flex-col items-center space-y-8 text-center">
						<div className="space-y-4">
							<h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl text-white">
								Ready to Get Started?
							</h2>
							<p className="mx-auto max-w-2xl text-lg text-blue-100 leading-relaxed">
								Start with our free plan and experience the power of AI-driven
								transcription today.
							</p>
						</div>

						<div className="flex flex-col sm:flex-row gap-4 pt-4">
							<Link href="/">
								<Button
									size="lg"
									variant="secondary"
									className="h-14 px-8 rounded-xl bg-white text-blue-600 hover:bg-gray-50"
								>
									Start Free Trial
								</Button>
							</Link>
							<Link href="/contact">
								<Button
									size="lg"
									variant="outline"
									className="h-14 px-8 rounded-xl border-white text-white hover:bg-white/10"
								>
									Contact Sales
								</Button>
							</Link>
						</div>
					</div>
				</div>
			</section>
		</div>
	);
}
