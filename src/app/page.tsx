"use client";

import { useUser } from "@clerk/nextjs";
import {
	CheckCircle,
	Clock,
	Download,
	FileAudio,
	Shield,
	Sparkles,
	Type,
	Upload,
	Zap,
} from "lucide-react";
import FileUpload from "@/components/file-upload";
import { HeroSection } from "@/components/hero-section";
import { PricingSection } from "@/components/pricing-section";
import { Badge } from "@/components/ui/badge";

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { SiteFooter } from "@/components/site-footer";

export default function HomePage() {
	const { isSignedIn } = useUser();

	return (
		<div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 bg-grid-slate-100">
			<main className="flex-1">
				{/* Hero Section */}
				{!isSignedIn && <HeroSection />}

				{/* Interactive Upload Section */}
				{isSignedIn && (
					<section className="w-full py-16 md:py-24 bg-white relative">
						<div className="absolute inset-0 bg-gradient-to-b from-gray-50/50 to-transparent"></div>
						<div className="container px-4 md:px-6 relative z-10">
							<div className="flex flex-col items-center justify-center space-y-8 text-center">
								<div className="space-y-4">
									<h2 className="text-3xl font-bold tracking-tight md:text-4xl bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
										Start Converting Your M4A Files
									</h2>
									<p className="mx-auto max-w-2xl text-lg text-gray-600 leading-relaxed">
										Upload your audio files and watch them transform into
										accurate text transcriptions in real-time.
									</p>
								</div>

								<div className="w-full max-w-4xl rounded-2xl glass-card">
									<FileUpload />
								</div>

								<div className="flex flex-wrap justify-center gap-4 text-xs text-gray-500 pt-4">
									<span className="flex items-center">
										<Shield className="mr-1 h-3 w-3" />
										Files automatically deleted after processing
									</span>
									<span>•</span>
									<span className="flex items-center">
										<Zap className="mr-1 h-3 w-3" />
										Lightning-fast AI processing
									</span>
									<span>•</span>
									<span className="flex items-center">
										<CheckCircle className="mr-1 h-3 w-3" />
										95%+ accuracy rate
									</span>
								</div>
							</div>
						</div>
					</section>
				)}

				{/* How It Works */}

				{!isSignedIn && (
					<section className="w-full py-20 md:py-32 bg-gradient-to-b from-gray-50 to-white">
						<div className="container px-4 md:px-6">
							<div className="flex flex-col items-center justify-center space-y-6 text-center mb-16">
								<Badge
									variant="outline"
									className="bg-white border-gray-200 text-gray-700"
								>
									Simple Process
								</Badge>
								<h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
									How It Works
								</h2>
								<p className="max-w-2xl text-lg text-gray-600 leading-relaxed">
									Convert your M4A files to text in just three simple steps
								</p>
							</div>

							<div className="mx-auto grid max-w-6xl items-start gap-8 lg:grid-cols-3">
								<Card className="text-center hover-lift border-0 shadow-lg bg-white/80 backdrop-blur-sm animate-fade-in-scale">
									<CardHeader className="pb-4">
										<div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg hover:shadow-xl transition-shadow mb-4">
											<Upload className="h-8 w-8" />
										</div>
										<div className="w-8 h-1 bg-gradient-to-r from-blue-500 to-indigo-600 mx-auto mb-4 rounded-full"></div>
										<CardTitle className="text-xl font-semibold">
											1. Upload Your M4A File
										</CardTitle>
									</CardHeader>
									<CardContent>
										<CardDescription className="text-base text-gray-600 leading-relaxed">
											Simply drag and drop your M4A audio file or click to
											browse and select from your device. Files up to 25MB
											supported.
										</CardDescription>
									</CardContent>
								</Card>

								<Card className="text-center hover-lift border-0 shadow-lg bg-white/80 backdrop-blur-sm animate-fade-in-scale">
									<CardHeader className="pb-4">
										<div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg hover:shadow-xl transition-shadow mb-4">
											<Zap className="h-8 w-8" />
										</div>
										<div className="w-8 h-1 bg-gradient-to-r from-indigo-500 to-purple-600 mx-auto mb-4 rounded-full"></div>
										<CardTitle className="text-xl font-semibold">
											2. AI Processing
										</CardTitle>
									</CardHeader>
									<CardContent>
										<CardDescription className="text-base text-gray-600 leading-relaxed">
											Our advanced OpenAI Whisper AI analyzes your audio and
											converts speech to text with industry-leading accuracy and
											speed.
										</CardDescription>
									</CardContent>
								</Card>

								<Card className="text-center hover-lift border-0 shadow-lg bg-white/80 backdrop-blur-sm animate-fade-in-scale">
									<CardHeader className="pb-4">
										<div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 text-white shadow-lg hover:shadow-xl transition-shadow mb-4">
											<Download className="h-8 w-8" />
										</div>
										<div className="w-8 h-1 bg-gradient-to-r from-purple-500 to-pink-600 mx-auto mb-4 rounded-full"></div>
										<CardTitle className="text-xl font-semibold">
											3. Download Text
										</CardTitle>
									</CardHeader>
									<CardContent>
										<CardDescription className="text-base text-gray-600 leading-relaxed">
											Get your transcription instantly as clean, formatted text.
											Copy to clipboard or download as TXT file for your
											projects.
										</CardDescription>
									</CardContent>
								</Card>
							</div>

							{/* Process Visualization */}
							<div className="flex justify-center items-center mt-16 space-x-8 animate-slide-in-bottom">
								<div className="hidden lg:flex items-center space-x-6">
									<div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse-color"></div>
									<div className="w-16 h-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 animate-shimmer"></div>
									<div className="w-3 h-3 bg-indigo-500 rounded-full animate-pulse-color delay-500"></div>
									<div className="w-16 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 animate-shimmer"></div>
									<div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse-color delay-1000"></div>
								</div>
							</div>
						</div>
					</section>
				)}

				{/* Features */}
				{!isSignedIn && (
					<section
						id="features"
						className="w-full py-20 md:py-32 bg-white relative overflow-hidden"
					>
						<div className="absolute inset-0 bg-gradient-to-r from-blue-50/30 via-indigo-50/20 to-purple-50/30"></div>
						<div className="container px-4 md:px-6 relative z-10">
							<div className="flex flex-col items-center justify-center space-y-6 text-center mb-16">
								<Badge
									variant="outline"
									className="bg-white border-blue-200 text-blue-700"
								>
									Key Benefits
								</Badge>
								<h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
									Why Choose AudioScribe?
								</h2>
								<p className="max-w-2xl text-lg text-gray-600 leading-relaxed">
									Powerful features designed to make audio transcription
									effortless and accurate
								</p>
							</div>

							<div className="mx-auto grid max-w-7xl items-start gap-12 lg:grid-cols-2">
								<div className="flex flex-col justify-center space-y-8">
									<div className="grid gap-8">
										<div className="flex items-start space-x-5 group">
											<div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg group-hover:shadow-xl transition-shadow">
												<Clock className="h-7 w-7" />
											</div>
											<div className="flex-1">
												<h3 className="text-xl font-bold mb-2 text-gray-900">
													Lightning Fast
												</h3>
												<p className="text-gray-600 leading-relaxed">
													Convert hours of audio to text in minutes with our
													optimized OpenAI Whisper processing. Real-time
													progress tracking keeps you informed.
												</p>
											</div>
										</div>

										<div className="flex items-start space-x-5 group">
											<div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg group-hover:shadow-xl transition-shadow">
												<Type className="h-7 w-7" />
											</div>
											<div className="flex-1">
												<h3 className="text-xl font-bold mb-2 text-gray-900">
													High Accuracy
												</h3>
												<p className="text-gray-600 leading-relaxed">
													95%+ accuracy rate with support for multiple languages
													and accents. Industry-leading AI ensures
													professional-quality transcriptions.
												</p>
											</div>
										</div>

										<div className="flex items-start space-x-5 group">
											<div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 text-white shadow-lg group-hover:shadow-xl transition-shadow">
												<Shield className="h-7 w-7" />
											</div>
											<div className="flex-1">
												<h3 className="text-xl font-bold mb-2 text-gray-900">
													Secure & Private
												</h3>
												<p className="text-gray-600 leading-relaxed">
													Your files are encrypted and automatically deleted
													after processing. Complete privacy guaranteed with
													enterprise-grade security.
												</p>
											</div>
										</div>
									</div>
								</div>

								<div className="flex items-center justify-center lg:justify-end">
									<div className="relative group hover-lift">
										<div className="absolute -inset-4 bg-gradient-to-r from-blue-500/20 via-indigo-500/20 to-purple-500/20 rounded-2xl blur-2xl group-hover:blur-3xl transition-all opacity-75 animate-pulse-color"></div>
										<Card className="relative w-full max-w-md shadow-2xl border-0 bg-white/90 backdrop-blur-sm transition-all duration-300 animate-fade-in-scale">
											<CardHeader className="pb-4">
												<CardTitle className="flex items-center text-lg font-semibold">
													<FileAudio className="mr-3 h-6 w-6 text-blue-600" />
													meeting-recording.m4a
												</CardTitle>
												<CardDescription className="text-gray-500">
													2.3 MB - 15:42 duration
												</CardDescription>
											</CardHeader>
											<CardContent className="space-y-5">
												<div className="space-y-3">
													<div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
														<div className="bg-gradient-to-r from-blue-500 to-indigo-600 h-3 rounded-full w-3/4 animate-pulse shadow-sm animate-shimmer"></div>
													</div>
													<p className="text-sm font-medium text-blue-600 animate-pulse-color">
														Processing... 75% complete
													</p>
												</div>

												<div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-xl border border-gray-200">
													<p className="font-semibold text-gray-900 mb-2 flex items-center">
														<Sparkles className="w-4 h-4 mr-2 text-blue-500 animate-float" />
														<span className="animate-gradient">
															Live Preview:
														</span>
													</p>
													<p className="text-gray-700 text-sm leading-relaxed italic">
														&quot;Good morning everyone, let&apos;s start
														today&apos;s meeting by reviewing the quarterly
														results and discussing our upcoming product launch
														strategy...&quot;
													</p>
												</div>
											</CardContent>
										</Card>
									</div>
								</div>
							</div>
						</div>
					</section>
				)}

				{/* Pricing Section */}
				{!isSignedIn && <PricingSection />}
			</main>
			{/* Footer */}
			<SiteFooter />
		</div>
	);
}
