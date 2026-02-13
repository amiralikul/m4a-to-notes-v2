"use client";

import {
	Award,
	CheckCircle,
	Clock,
	FileAudio,
	Globe,
	Heart,
	Lightbulb,
	Shield,
	Sparkles,
	Target,
	TrendingUp,
	Users,
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

export default function AboutPage() {
	return (
		<div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">

			<section className="relative w-full py-20 md:py-32 overflow-hidden">
				test 2
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
								<Heart className="w-3 h-3 mr-1" />
								Our Story
							</Badge>
							<h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl max-w-5xl">
								Transforming Audio into
								<span className="block bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent mt-2">
									Accessible Knowledge
								</span>
							</h1>
							<p className="mx-auto max-w-2xl text-lg md:text-xl text-gray-600 leading-relaxed">
								AudioScribe was born from a simple belief: everyone deserves
								easy access to the information locked away in audio files. We're
								making transcription faster, more accurate, and more accessible
								than ever.
							</p>
						</div>

						<div className="flex flex-col sm:flex-row gap-4 pt-4">
							<Link href="/">
								<Button
									size="lg"
									className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white h-14 px-8 rounded-xl"
								>
									Try AudioScribe
								</Button>
							</Link>
							<Link href="/contact">
								<Button
									size="lg"
									variant="outline"
									className="h-14 px-8 rounded-xl border-gray-300"
								>
									Get in Touch
								</Button>
							</Link>
						</div>
					</div>
				</div>
			</section>

			{/* Our Mission */}
			<section className="w-full py-20 md:py-32 bg-white relative overflow-hidden">
				<div className="absolute inset-0 bg-gradient-to-r from-blue-50/30 via-indigo-50/20 to-purple-50/30"></div>
				<div className="container px-4 md:px-6 relative z-10">
					<div className="flex flex-col items-center justify-center space-y-6 text-center mb-16">
						<Badge
							variant="outline"
							className="bg-white border-blue-200 text-blue-700"
						>
							Our Mission
						</Badge>
						<h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
							Making Audio Accessible to Everyone
						</h2>
					</div>

					<div className="mx-auto grid max-w-7xl items-start gap-12 lg:grid-cols-2">
						<div className="flex flex-col justify-center space-y-8">
							<div className="space-y-6">
								<div className="flex items-start space-x-5 group">
									<div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg group-hover:shadow-xl transition-shadow">
										<Target className="h-7 w-7" />
									</div>
									<div className="flex-1">
										<h3 className="text-xl font-bold mb-2 text-gray-900">
											Our Vision
										</h3>
										<p className="text-gray-600 leading-relaxed">
											To create a world where information in audio format is as
											searchable, accessible, and useful as written text. We
											believe technology should break down barriers, not create
											them.
										</p>
									</div>
								</div>

								<div className="flex items-start space-x-5 group">
									<div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg group-hover:shadow-xl transition-shadow">
										<Lightbulb className="h-7 w-7" />
									</div>
									<div className="flex-1">
										<h3 className="text-xl font-bold mb-2 text-gray-900">
											Innovation First
										</h3>
										<p className="text-gray-600 leading-relaxed">
											We constantly push the boundaries of what's possible with
											AI and machine learning, always seeking new ways to
											improve accuracy, speed, and user experience.
										</p>
									</div>
								</div>

								<div className="flex items-start space-x-5 group">
									<div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 text-white shadow-lg group-hover:shadow-xl transition-shadow">
										<Shield className="h-7 w-7" />
									</div>
									<div className="flex-1">
										<h3 className="text-xl font-bold mb-2 text-gray-900">
											Privacy by Design
										</h3>
										<p className="text-gray-600 leading-relaxed">
											Your data is yours. We built AudioScribe with privacy at
											its core, ensuring your files are secure, encrypted, and
											automatically deleted after processing.
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
											AudioScribe Impact
										</CardTitle>
										<CardDescription className="text-gray-500">
											Transforming workflows worldwide
										</CardDescription>
									</CardHeader>
									<CardContent className="space-y-4">
										<div className="space-y-4">
											<div className="flex items-center justify-between">
												<span className="text-sm font-medium">
													Files Processed
												</span>
												<span className="font-bold text-blue-600">1M+</span>
											</div>
											<div className="flex items-center justify-between">
												<span className="text-sm font-medium">
													Hours Transcribed
												</span>
												<span className="font-bold text-indigo-600">500K+</span>
											</div>
											<div className="flex items-center justify-between">
												<span className="text-sm font-medium">
													Languages Supported
												</span>
												<span className="font-bold text-purple-600">50+</span>
											</div>
											<div className="flex items-center justify-between">
												<span className="text-sm font-medium">Happy Users</span>
												<span className="font-bold text-green-600">25K+</span>
											</div>
										</div>
									</CardContent>
								</Card>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Our Values */}
			<section className="w-full py-20 md:py-32 bg-gradient-to-b from-gray-50 to-white">
				<div className="container px-4 md:px-6">
					<div className="flex flex-col items-center justify-center space-y-6 text-center mb-16">
						<Badge
							variant="outline"
							className="bg-white border-gray-200 text-gray-700"
						>
							Our Values
						</Badge>
						<h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
							What Drives Us Every Day
						</h2>
					</div>

					<div className="mx-auto grid max-w-6xl items-start gap-8 lg:grid-cols-3">
						<Card className="text-center border-0 shadow-lg bg-white/80 backdrop-blur-sm">
							<CardHeader className="pb-4">
								<div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg mb-4">
									<Users className="h-8 w-8" />
								</div>
								<CardTitle className="text-xl font-semibold">
									User-Centric Design
								</CardTitle>
							</CardHeader>
							<CardContent>
								<CardDescription className="text-base text-gray-600 leading-relaxed">
									Every feature we build starts with understanding our users'
									needs. We believe great technology should be invisible –
									powerful yet simple to use.
								</CardDescription>
							</CardContent>
						</Card>

						<Card className="text-center border-0 shadow-lg bg-white/80 backdrop-blur-sm">
							<CardHeader className="pb-4">
								<div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg mb-4">
									<Award className="h-8 w-8" />
								</div>
								<CardTitle className="text-xl font-semibold">
									Excellence in Everything
								</CardTitle>
							</CardHeader>
							<CardContent>
								<CardDescription className="text-base text-gray-600 leading-relaxed">
									We're not satisfied with "good enough." From accuracy rates to
									user experience, we strive for excellence in every aspect of
									our service.
								</CardDescription>
							</CardContent>
						</Card>

						<Card className="text-center border-0 shadow-lg bg-white/80 backdrop-blur-sm">
							<CardHeader className="pb-4">
								<div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 text-white shadow-lg mb-4">
									<Globe className="h-8 w-8" />
								</div>
								<CardTitle className="text-xl font-semibold">
									Global Accessibility
								</CardTitle>
							</CardHeader>
							<CardContent>
								<CardDescription className="text-base text-gray-600 leading-relaxed">
									Language should never be a barrier to accessing information.
									We're committed to supporting languages and dialects from
									around the world.
								</CardDescription>
							</CardContent>
						</Card>
					</div>
				</div>
			</section>

			{/* Our Journey */}
			<section className="w-full py-20 md:py-32 bg-white">
				<div className="container px-4 md:px-6">
					<div className="flex flex-col items-center justify-center space-y-6 text-center mb-16">
						<Badge
							variant="outline"
							className="bg-white border-blue-200 text-blue-700"
						>
							Our Journey
						</Badge>
						<h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
							From Idea to Impact
						</h2>
					</div>

					<div className="mx-auto max-w-4xl">
						<div className="space-y-12">
							{/* Timeline Item 1 */}
							<div className="flex items-start space-x-6">
								<div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg">
									<Lightbulb className="h-6 w-6" />
								</div>
								<div className="flex-1">
									<div className="flex items-center space-x-4 mb-2">
										<h3 className="text-xl font-bold text-gray-900">
											The Spark
										</h3>
										<Badge variant="secondary" className="text-xs">
											2023
										</Badge>
									</div>
									<p className="text-gray-600 leading-relaxed">
										Frustrated by the time-consuming process of manually
										transcribing interviews and meetings, our founders set out
										to create a better solution. The goal was simple: make
										transcription as easy as uploading a file.
									</p>
								</div>
							</div>

							{/* Timeline Item 2 */}
							<div className="flex items-start space-x-6">
								<div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg">
									<Clock className="h-6 w-6" />
								</div>
								<div className="flex-1">
									<div className="flex items-center space-x-4 mb-2">
										<h3 className="text-xl font-bold text-gray-900">
											Building the Foundation
										</h3>
										<Badge variant="secondary" className="text-xs">
											2023
										</Badge>
									</div>
									<p className="text-gray-600 leading-relaxed">
										Months of research, development, and testing led to our
										first prototype. We focused on creating a system that
										prioritized accuracy, speed, and user privacy from day one.
									</p>
								</div>
							</div>

							{/* Timeline Item 3 */}
							<div className="flex items-start space-x-6">
								<div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-600 text-white shadow-lg">
									<TrendingUp className="h-6 w-6" />
								</div>
								<div className="flex-1">
									<div className="flex items-center space-x-4 mb-2">
										<h3 className="text-xl font-bold text-gray-900">
											Launch & Growth
										</h3>
										<Badge variant="secondary" className="text-xs">
											2024
										</Badge>
									</div>
									<p className="text-gray-600 leading-relaxed">
										AudioScribe launched to an enthusiastic response from early
										users. Their feedback helped us refine our service and add
										features that matter most to real-world workflows.
									</p>
								</div>
							</div>

							{/* Timeline Item 4 */}
							<div className="flex items-start space-x-6">
								<div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg">
									<CheckCircle className="h-6 w-6" />
								</div>
								<div className="flex-1">
									<div className="flex items-center space-x-4 mb-2">
										<h3 className="text-xl font-bold text-gray-900">
											Today & Beyond
										</h3>
										<Badge variant="secondary" className="text-xs">
											Present
										</Badge>
									</div>
									<p className="text-gray-600 leading-relaxed">
										Today, AudioScribe serves thousands of users worldwide,
										processing millions of minutes of audio monthly. We're just
										getting started on our mission to make audio accessible to
										everyone.
									</p>
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Team Section */}
			<section className="w-full py-20 md:py-32 bg-gradient-to-b from-gray-50 to-white">
				<div className="container px-4 md:px-6">
					<div className="flex flex-col items-center justify-center space-y-6 text-center mb-16">
						<Badge
							variant="outline"
							className="bg-white border-gray-200 text-gray-700"
						>
							Our Team
						</Badge>
						<h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
							The People Behind AudioScribe
						</h2>
						<p className="max-w-2xl text-lg text-gray-600 leading-relaxed">
							We're a passionate team of engineers, designers, and researchers
							united by a common goal: making audio content accessible to
							everyone.
						</p>
					</div>

					<div className="mx-auto max-w-5xl">
						<Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm p-8">
							<div className="text-center space-y-6">
								<div className="flex justify-center space-x-4 flex-wrap">
									<Badge variant="secondary" className="mb-2">
										Engineering
									</Badge>
									<Badge variant="secondary" className="mb-2">
										AI/ML Research
									</Badge>
									<Badge variant="secondary" className="mb-2">
										User Experience
									</Badge>
									<Badge variant="secondary" className="mb-2">
										Product Design
									</Badge>
									<Badge variant="secondary" className="mb-2">
										Customer Success
									</Badge>
								</div>
								<p className="text-lg text-gray-700 leading-relaxed">
									Our diverse team brings together expertise in machine
									learning, software engineering, user experience design, and
									customer success. We're distributed across multiple time zones
									but united by our commitment to building the best
									transcription service possible.
								</p>
								<div className="flex justify-center pt-4">
									<Link href="/contact">
										<Button variant="outline" className="rounded-xl">
											<Users className="mr-2 h-4 w-4" />
											Join Our Team
										</Button>
									</Link>
								</div>
							</div>
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
								Join thousands of professionals who trust AudioScribe to convert
								their audio content into accessible, searchable text.
							</p>
						</div>

						<div className="flex flex-col sm:flex-row gap-4 pt-4">
							<Link href="/">
								<Button
									size="lg"
									variant="secondary"
									className="h-14 px-8 rounded-xl bg-white text-blue-600 hover:bg-gray-50"
								>
									<Sparkles className="mr-2 h-5 w-5" />
									Try AudioScribe Now
								</Button>
							</Link>
							<Link href="/contact">
								<Button
									size="lg"
									variant="outline"
									className="h-14 px-8 rounded-xl border-white text-white hover:bg-white/10"
								>
									Get in Touch
								</Button>
							</Link>
						</div>
					</div>
				</div>
			</section>
		</div>
	);
}
