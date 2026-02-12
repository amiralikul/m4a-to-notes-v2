"use client";

import {
	BarChart3,
	CheckCircle,
	Clock,
	Download,
	FileAudio,
	Globe,
	Settings,
	Shield,
	Sparkles,
	Type,
	Upload,
	Zap,
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

export default function FeaturesPage() {
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
								Powerful Features
							</Badge>
							<h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl max-w-5xl">
								Everything You Need for
								<span className="block bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent mt-2">
									Perfect Transcription
								</span>
							</h1>
							<p className="mx-auto max-w-2xl text-lg md:text-xl text-gray-600 leading-relaxed">
								Discover all the powerful features that make AudioScribe the
								best choice for converting your M4A files to accurate text
								transcriptions.
							</p>
						</div>

						<div className="flex flex-col sm:flex-row gap-4 pt-4">
							<Link href="/">
								<Button
									size="lg"
									className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white h-14 px-8 rounded-xl"
								>
									<Upload className="mr-2 h-5 w-5" />
									Try AudioScribe Now
								</Button>
							</Link>
							<Link href="/pricing">
								<Button
									size="lg"
									variant="outline"
									className="h-14 px-8 rounded-xl border-gray-300"
								>
									View Pricing
								</Button>
							</Link>
						</div>
					</div>
				</div>
			</section>

			{/* Core Features Section */}
			<section className="w-full py-20 md:py-32 bg-white relative overflow-hidden">
				<div className="absolute inset-0 bg-gradient-to-r from-blue-50/30 via-indigo-50/20 to-purple-50/30"></div>
				<div className="container px-4 md:px-6 relative z-10">
					<div className="flex flex-col items-center justify-center space-y-6 text-center mb-16">
						<Badge
							variant="outline"
							className="bg-white border-blue-200 text-blue-700"
						>
							Core Features
						</Badge>
						<h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
							Built for Performance & Accuracy
						</h2>
						<p className="max-w-2xl text-lg text-gray-600 leading-relaxed">
							Our advanced AI-powered features ensure you get the most accurate
							and efficient transcription experience
						</p>
					</div>

					<div className="mx-auto grid max-w-7xl items-start gap-8 lg:grid-cols-3">
						<Card className="text-center border-0 shadow-lg bg-white/80 backdrop-blur-sm">
							<CardHeader className="pb-4">
								<div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg mb-4">
									<Clock className="h-8 w-8" />
								</div>
								<CardTitle className="text-xl font-semibold">
									Lightning Fast Processing
								</CardTitle>
							</CardHeader>
							<CardContent>
								<CardDescription className="text-base text-gray-600 leading-relaxed">
									Convert hours of audio to text in minutes with our optimized
									OpenAI Whisper processing. Real-time progress tracking keeps
									you informed throughout the entire process.
								</CardDescription>
							</CardContent>
						</Card>

						<Card className="text-center border-0 shadow-lg bg-white/80 backdrop-blur-sm">
							<CardHeader className="pb-4">
								<div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg mb-4">
									<Type className="h-8 w-8" />
								</div>
								<CardTitle className="text-xl font-semibold">
									Industry-Leading Accuracy
								</CardTitle>
							</CardHeader>
							<CardContent>
								<CardDescription className="text-base text-gray-600 leading-relaxed">
									95%+ accuracy rate with support for multiple languages and
									accents. Our advanced AI understands context and delivers
									professional-quality results.
								</CardDescription>
							</CardContent>
						</Card>

						<Card className="text-center border-0 shadow-lg bg-white/80 backdrop-blur-sm">
							<CardHeader className="pb-4">
								<div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 text-white shadow-lg mb-4">
									<Shield className="h-8 w-8" />
								</div>
								<CardTitle className="text-xl font-semibold">
									Security & Privacy
								</CardTitle>
							</CardHeader>
							<CardContent>
								<CardDescription className="text-base text-gray-600 leading-relaxed">
									Your files are encrypted and automatically deleted after 24
									hours. Enterprise-grade security ensures your data remains
									completely private.
								</CardDescription>
							</CardContent>
						</Card>
					</div>
				</div>
			</section>

			{/* Advanced Features Section */}
			<section className="w-full py-20 md:py-32 bg-gradient-to-b from-gray-50 to-white">
				<div className="container px-4 md:px-6">
					<div className="flex flex-col items-center justify-center space-y-6 text-center mb-16">
						<Badge
							variant="outline"
							className="bg-white border-gray-200 text-gray-700"
						>
							Advanced Capabilities
						</Badge>
						<h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
							Professional Tools for Every Need
						</h2>
					</div>

					<div className="mx-auto grid max-w-6xl items-start gap-12 lg:grid-cols-2">
						<div className="flex flex-col justify-center space-y-8">
							<div className="grid gap-8">
								<div className="flex items-start space-x-5 group">
									<div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg group-hover:shadow-xl transition-shadow">
										<Globe className="h-7 w-7" />
									</div>
									<div className="flex-1">
										<h3 className="text-xl font-bold mb-2 text-gray-900">
											Multi-Language Support
										</h3>
										<p className="text-gray-600 leading-relaxed">
											Support for over 50 languages with automatic language
											detection. Perfect for international meetings, interviews,
											and multilingual content.
										</p>
									</div>
								</div>

								<div className="flex items-start space-x-5 group">
									<div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 text-white shadow-lg group-hover:shadow-xl transition-shadow">
										<Settings className="h-7 w-7" />
									</div>
									<div className="flex-1">
										<h3 className="text-xl font-bold mb-2 text-gray-900">
											Flexible Output Formats
										</h3>
										<p className="text-gray-600 leading-relaxed">
											Export your transcriptions in multiple formats including
											plain text, formatted documents, and structured data with
											timestamps and speaker identification.
										</p>
									</div>
								</div>

								<div className="flex items-start space-x-5 group">
									<div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg group-hover:shadow-xl transition-shadow">
										<BarChart3 className="h-7 w-7" />
									</div>
									<div className="flex-1">
										<h3 className="text-xl font-bold mb-2 text-gray-900">
											Usage Analytics
										</h3>
										<p className="text-gray-600 leading-relaxed">
											Track your transcription usage, monitor accuracy rates,
											and optimize your workflow with detailed analytics and
											reporting features.
										</p>
									</div>
								</div>
							</div>
						</div>

						<div className="flex items-center justify-center lg:justify-end">
							<div className="relative group">
								<div className="absolute -inset-4 bg-gradient-to-r from-blue-500/20 via-indigo-500/20 to-purple-500/20 rounded-2xl blur-2xl group-hover:blur-3xl transition-all opacity-75"></div>
								<Card className="relative w-full max-w-md shadow-2xl border-0 bg-white/90 backdrop-blur-sm">
									<CardHeader className="pb-4">
										<CardTitle className="flex items-center text-lg font-semibold">
											<FileAudio className="mr-3 h-6 w-6 text-blue-600" />
											Advanced Processing
										</CardTitle>
										<CardDescription className="text-gray-500">
											Real-time feature detection
										</CardDescription>
									</CardHeader>
									<CardContent className="space-y-4">
										<div className="space-y-3">
											<div className="flex items-center justify-between">
												<span className="text-sm font-medium">
													Language Detection
												</span>
												<CheckCircle className="h-4 w-4 text-green-500" />
											</div>
											<div className="flex items-center justify-between">
												<span className="text-sm font-medium">
													Speaker Identification
												</span>
												<CheckCircle className="h-4 w-4 text-green-500" />
											</div>
											<div className="flex items-center justify-between">
												<span className="text-sm font-medium">
													Noise Reduction
												</span>
												<CheckCircle className="h-4 w-4 text-green-500" />
											</div>
											<div className="flex items-center justify-between">
												<span className="text-sm font-medium">
													Quality Enhancement
												</span>
												<Zap className="h-4 w-4 text-blue-500 animate-pulse" />
											</div>
										</div>
									</CardContent>
								</Card>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* How It Works Section */}
			<section className="w-full py-20 md:py-32 bg-white">
				<div className="container px-4 md:px-6">
					<div className="flex flex-col items-center justify-center space-y-6 text-center mb-16">
						<Badge
							variant="outline"
							className="bg-white border-blue-200 text-blue-700"
						>
							Simple Process
						</Badge>
						<h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
							How AudioScribe Works
						</h2>
						<p className="max-w-2xl text-lg text-gray-600 leading-relaxed">
							Convert your M4A files to text in just three simple steps
						</p>
					</div>

					<div className="mx-auto grid max-w-6xl items-start gap-8 lg:grid-cols-3">
						<Card className="text-center border-0 shadow-lg bg-white/80 backdrop-blur-sm">
							<CardHeader className="pb-4">
								<div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg mb-4">
									<Upload className="h-8 w-8" />
								</div>
								<div className="w-8 h-1 bg-gradient-to-r from-blue-500 to-indigo-600 mx-auto mb-4 rounded-full"></div>
								<CardTitle className="text-xl font-semibold">
									1. Upload Your M4A File
								</CardTitle>
							</CardHeader>
							<CardContent>
								<CardDescription className="text-base text-gray-600 leading-relaxed">
									Simply drag and drop your M4A audio file or click to browse
									and select from your device. Files up to 25MB supported with
									secure encryption.
								</CardDescription>
							</CardContent>
						</Card>

						<Card className="text-center border-0 shadow-lg bg-white/80 backdrop-blur-sm">
							<CardHeader className="pb-4">
								<div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg mb-4">
									<Zap className="h-8 w-8" />
								</div>
								<div className="w-8 h-1 bg-gradient-to-r from-indigo-500 to-purple-600 mx-auto mb-4 rounded-full"></div>
								<CardTitle className="text-xl font-semibold">
									2. AI Processing
								</CardTitle>
							</CardHeader>
							<CardContent>
								<CardDescription className="text-base text-gray-600 leading-relaxed">
									Our advanced OpenAI Whisper AI analyzes your audio with
									real-time progress updates. Advanced noise reduction and
									quality enhancement ensure optimal results.
								</CardDescription>
							</CardContent>
						</Card>

						<Card className="text-center border-0 shadow-lg bg-white/80 backdrop-blur-sm">
							<CardHeader className="pb-4">
								<div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 text-white shadow-lg mb-4">
									<Download className="h-8 w-8" />
								</div>
								<div className="w-8 h-1 bg-gradient-to-r from-purple-500 to-pink-600 mx-auto mb-4 rounded-full"></div>
								<CardTitle className="text-xl font-semibold">
									3. Download & Use
								</CardTitle>
							</CardHeader>
							<CardContent>
								<CardDescription className="text-base text-gray-600 leading-relaxed">
									Get your transcription instantly as clean, formatted text.
									Copy to clipboard, download as TXT file, or export in your
									preferred format.
								</CardDescription>
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
								Ready to Transform Your Audio?
							</h2>
							<p className="mx-auto max-w-2xl text-lg text-blue-100 leading-relaxed">
								Join thousands of professionals who trust AudioScribe for
								accurate, fast transcriptions.
							</p>
						</div>

						<div className="flex flex-col sm:flex-row gap-4 pt-4">
							<Link href="/">
								<Button
									size="lg"
									variant="secondary"
									className="h-14 px-8 rounded-xl bg-white text-blue-600 hover:bg-gray-50"
								>
									<Upload className="mr-2 h-5 w-5" />
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
