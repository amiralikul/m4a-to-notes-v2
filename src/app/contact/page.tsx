"use client";

import {
	Building,
	CheckCircle,
	Clock,
	Headphones,
	HelpCircle,
	Mail,
	MapPin,
	MessageCircle,
	Phone,
	Send,
	Sparkles,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function ContactPage() {
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
								<MessageCircle className="w-3 h-3 mr-1" />
								Get in Touch
							</Badge>
							<h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl max-w-5xl">
								We're Here to Help
								<span className="block bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent mt-2">
									Every Step of the Way
								</span>
							</h1>
							<p className="mx-auto max-w-2xl text-lg md:text-xl text-gray-600 leading-relaxed">
								Have questions about AudioScribe? Need help with your account?
								Want to explore enterprise solutions? We'd love to hear from
								you.
							</p>
						</div>

						<div className="flex flex-wrap justify-center gap-4 text-sm text-gray-600 pt-4">
							<div className="flex items-center bg-white/60 px-4 py-2 rounded-full shadow-sm">
								<CheckCircle className="mr-2 h-4 w-4 text-emerald-500" />
								24/7 Support Available
							</div>
							<div className="flex items-center bg-white/60 px-4 py-2 rounded-full shadow-sm">
								<CheckCircle className="mr-2 h-4 w-4 text-emerald-500" />
								Quick Response Times
							</div>
							<div className="flex items-center bg-white/60 px-4 py-2 rounded-full shadow-sm">
								<CheckCircle className="mr-2 h-4 w-4 text-emerald-500" />
								Expert Technical Team
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Contact Methods */}
			<section className="w-full py-20 md:py-32 bg-white relative overflow-hidden">
				<div className="absolute inset-0 bg-gradient-to-r from-blue-50/30 via-indigo-50/20 to-purple-50/30"></div>
				<div className="container px-4 md:px-6 relative z-10">
					<div className="flex flex-col items-center justify-center space-y-6 text-center mb-16">
						<Badge
							variant="outline"
							className="bg-white border-blue-200 text-blue-700"
						>
							Contact Options
						</Badge>
						<h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
							Choose Your Preferred Way to Connect
						</h2>
					</div>

					<div className="mx-auto grid max-w-6xl items-start gap-8 lg:grid-cols-3">
						<Card className="text-center border-0 shadow-lg bg-white/80 backdrop-blur-sm group hover:shadow-xl transition-shadow">
							<CardHeader className="pb-4">
								<div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg mb-4 group-hover:shadow-xl transition-shadow">
									<Mail className="h-8 w-8" />
								</div>
								<CardTitle className="text-xl font-semibold">
									Email Support
								</CardTitle>
							</CardHeader>
							<CardContent>
								<CardDescription className="text-base text-gray-600 leading-relaxed mb-4">
									Send us an email and we'll get back to you within 24 hours.
									Perfect for detailed questions or technical support requests.
								</CardDescription>
								<Button
									className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl"
									onClick={() =>
										(window.location.href = "mailto:support@audioscribe.com")
									}
								>
									<Mail className="mr-2 h-4 w-4" />
									support@audioscribe.com
								</Button>
							</CardContent>
						</Card>

						<Card className="text-center border-0 shadow-lg bg-white/80 backdrop-blur-sm group hover:shadow-xl transition-shadow">
							<CardHeader className="pb-4">
								<div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg mb-4 group-hover:shadow-xl transition-shadow">
									<MessageCircle className="h-8 w-8" />
								</div>
								<CardTitle className="text-xl font-semibold">
									Live Chat
								</CardTitle>
							</CardHeader>
							<CardContent>
								<CardDescription className="text-base text-gray-600 leading-relaxed mb-4">
									Get instant answers to your questions with our live chat
									support. Available during business hours for immediate
									assistance.
								</CardDescription>
								<Button
									variant="outline"
									className="w-full border-indigo-500 text-indigo-600 hover:bg-indigo-50 rounded-xl"
								>
									<MessageCircle className="mr-2 h-4 w-4" />
									Start Live Chat
								</Button>
							</CardContent>
						</Card>

						<Card className="text-center border-0 shadow-lg bg-white/80 backdrop-blur-sm group hover:shadow-xl transition-shadow">
							<CardHeader className="pb-4">
								<div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 text-white shadow-lg mb-4 group-hover:shadow-xl transition-shadow">
									<Phone className="h-8 w-8" />
								</div>
								<CardTitle className="text-xl font-semibold">
									Phone Support
								</CardTitle>
							</CardHeader>
							<CardContent>
								<CardDescription className="text-base text-gray-600 leading-relaxed mb-4">
									Speak directly with our support team for complex issues or
									urgent matters. Available for Pro and Business plan customers.
								</CardDescription>
								<Button
									variant="outline"
									className="w-full border-purple-500 text-purple-600 hover:bg-purple-50 rounded-xl"
								>
									<Phone className="mr-2 h-4 w-4" />
									Request Callback
								</Button>
							</CardContent>
						</Card>
					</div>
				</div>
			</section>

			{/* Contact Form */}
			<section className="w-full py-20 md:py-32 bg-gradient-to-b from-gray-50 to-white">
				<div className="container px-4 md:px-6">
					<div className="mx-auto max-w-4xl">
						<div className="flex flex-col items-center justify-center space-y-6 text-center mb-16">
							<Badge
								variant="outline"
								className="bg-white border-gray-200 text-gray-700"
							>
								Send us a Message
							</Badge>
							<h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
								Tell Us How We Can Help
							</h2>
						</div>

						<Card className="border-0 shadow-2xl bg-white/90 backdrop-blur-sm">
							<CardContent className="p-8">
								<form className="space-y-6">
									<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
										<div className="space-y-2">
											<Label htmlFor="firstName">First Name *</Label>
											<Input
												id="firstName"
												placeholder="John"
												className="rounded-xl border-gray-300 focus:border-blue-500 focus:ring-blue-500"
											/>
										</div>
										<div className="space-y-2">
											<Label htmlFor="lastName">Last Name *</Label>
											<Input
												id="lastName"
												placeholder="Doe"
												className="rounded-xl border-gray-300 focus:border-blue-500 focus:ring-blue-500"
											/>
										</div>
									</div>

									<div className="space-y-2">
										<Label htmlFor="email">Email Address *</Label>
										<Input
											id="email"
											type="email"
											placeholder="john@example.com"
											className="rounded-xl border-gray-300 focus:border-blue-500 focus:ring-blue-500"
										/>
									</div>

									<div className="space-y-2">
										<Label htmlFor="company">Company (Optional)</Label>
										<Input
											id="company"
											placeholder="Acme Corp"
											className="rounded-xl border-gray-300 focus:border-blue-500 focus:ring-blue-500"
										/>
									</div>

									<div className="space-y-2">
										<Label htmlFor="subject">Subject *</Label>
										<Input
											id="subject"
											placeholder="How can we help you?"
											className="rounded-xl border-gray-300 focus:border-blue-500 focus:ring-blue-500"
										/>
									</div>

									<div className="space-y-2">
										<Label htmlFor="message">Message *</Label>
										<Textarea
											id="message"
											placeholder="Tell us more about your question or how we can assist you..."
											className="rounded-xl border-gray-300 focus:border-blue-500 focus:ring-blue-500 min-h-[120px]"
										/>
									</div>

									<Button
										size="lg"
										className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white h-14 rounded-xl"
									>
										<Send className="mr-2 h-5 w-5" />
										Send Message
									</Button>
								</form>
							</CardContent>
						</Card>
					</div>
				</div>
			</section>

			{/* Support Categories */}
			<section className="w-full py-20 md:py-32 bg-white">
				<div className="container px-4 md:px-6">
					<div className="flex flex-col items-center justify-center space-y-6 text-center mb-16">
						<Badge
							variant="outline"
							className="bg-white border-blue-200 text-blue-700"
						>
							Support Categories
						</Badge>
						<h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
							What Can We Help You With?
						</h2>
					</div>

					<div className="mx-auto grid max-w-6xl items-start gap-8 lg:grid-cols-4">
						<Card className="text-center border-0 shadow-lg bg-white/80 backdrop-blur-sm">
							<CardHeader className="pb-4">
								<div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg mb-4">
									<Headphones className="h-7 w-7" />
								</div>
								<CardTitle className="text-lg font-semibold">
									Technical Support
								</CardTitle>
							</CardHeader>
							<CardContent>
								<CardDescription className="text-sm text-gray-600 leading-relaxed">
									Issues with uploads, transcription quality, account access, or
									billing questions.
								</CardDescription>
							</CardContent>
						</Card>

						<Card className="text-center border-0 shadow-lg bg-white/80 backdrop-blur-sm">
							<CardHeader className="pb-4">
								<div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg mb-4">
									<Building className="h-7 w-7" />
								</div>
								<CardTitle className="text-lg font-semibold">
									Enterprise Sales
								</CardTitle>
							</CardHeader>
							<CardContent>
								<CardDescription className="text-sm text-gray-600 leading-relaxed">
									Custom solutions, volume pricing, API integration, and
									enterprise features.
								</CardDescription>
							</CardContent>
						</Card>

						<Card className="text-center border-0 shadow-lg bg-white/80 backdrop-blur-sm">
							<CardHeader className="pb-4">
								<div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 text-white shadow-lg mb-4">
									<Users className="h-7 w-7" />
								</div>
								<CardTitle className="text-lg font-semibold">
									Partnerships
								</CardTitle>
							</CardHeader>
							<CardContent>
								<CardDescription className="text-sm text-gray-600 leading-relaxed">
									Integration opportunities, reseller programs, and strategic
									partnerships.
								</CardDescription>
							</CardContent>
						</Card>

						<Card className="text-center border-0 shadow-lg bg-white/80 backdrop-blur-sm">
							<CardHeader className="pb-4">
								<div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg mb-4">
									<HelpCircle className="h-7 w-7" />
								</div>
								<CardTitle className="text-lg font-semibold">
									General Inquiries
								</CardTitle>
							</CardHeader>
							<CardContent>
								<CardDescription className="text-sm text-gray-600 leading-relaxed">
									Product questions, feature requests, feedback, or anything
									else we can help with.
								</CardDescription>
							</CardContent>
						</Card>
					</div>
				</div>
			</section>

			{/* Office Information */}
			<section className="w-full py-20 md:py-32 bg-gradient-to-b from-gray-50 to-white">
				<div className="container px-4 md:px-6">
					<div className="mx-auto max-w-4xl">
						<div className="flex flex-col items-center justify-center space-y-6 text-center mb-16">
							<Badge
								variant="outline"
								className="bg-white border-gray-200 text-gray-700"
							>
								Our Locations
							</Badge>
							<h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
								Find Us Around the World
							</h2>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
							<Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
								<CardHeader>
									<CardTitle className="flex items-center text-lg font-semibold">
										<MapPin className="mr-3 h-5 w-5 text-blue-600" />
										Global Headquarters
									</CardTitle>
								</CardHeader>
								<CardContent className="space-y-3">
									<p className="text-gray-600">
										San Francisco, CA
										<br />
										United States
									</p>
									<div className="flex items-center text-sm text-gray-500">
										<Clock className="mr-2 h-4 w-4" />
										Pacific Time (PST/PDT)
									</div>
								</CardContent>
							</Card>

							<Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
								<CardHeader>
									<CardTitle className="flex items-center text-lg font-semibold">
										<MapPin className="mr-3 h-5 w-5 text-indigo-600" />
										European Office
									</CardTitle>
								</CardHeader>
								<CardContent className="space-y-3">
									<p className="text-gray-600">
										London, UK
										<br />
										United Kingdom
									</p>
									<div className="flex items-center text-sm text-gray-500">
										<Clock className="mr-2 h-4 w-4" />
										Greenwich Time (GMT/BST)
									</div>
								</CardContent>
							</Card>
						</div>
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
								Don't wait – start transcribing your audio files today with
								AudioScribe's powerful AI technology.
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
							<Link href="/pricing">
								<Button
									size="lg"
									variant="outline"
									className="h-14 px-8 rounded-xl border-white text-white hover:bg-white/10"
								>
									View Pricing Plans
								</Button>
							</Link>
						</div>
					</div>
				</div>
			</section>
		</div>
	);
}
