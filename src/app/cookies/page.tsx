"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Cookie } from "lucide-react";

export default function CookiePolicyPage() {
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
								<Cookie className="w-3 h-3 mr-1" />
								Cookies
							</Badge>
							<h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl max-w-5xl">
								Cookie Policy
							</h1>
							<p className="mx-auto max-w-2xl text-lg md:text-xl text-gray-600 leading-relaxed">
								Learn about how we use cookies and similar technologies to improve your experience
							</p>
						</div>
					</div>
				</div>
			</section>

			{/* Content Section */}
			<section className="w-full py-20 bg-white relative overflow-hidden">
				<div className="container px-4 md:px-6">
					<Card className="max-w-4xl mx-auto border-0 shadow-lg bg-white/90 backdrop-blur-sm">
						<CardContent className="p-8 md:p-12">
							<div className="prose prose-gray max-w-none">
								<p className="text-sm text-gray-600 mb-8">
									Last updated: {new Date().toLocaleDateString()}
								</p>

								<h2 className="text-2xl font-bold text-gray-900 mb-4">
									1. What Are Cookies?
								</h2>
								<p className="text-gray-700 mb-6">
									Cookies are small text files that are placed on your device
									(computer, tablet, or mobile) when you visit our website.
									They help us provide you with a better experience by
									remembering your preferences and understanding how you use
									our service.
								</p>

								<h2 className="text-2xl font-bold text-gray-900 mb-4">
									2. How We Use Cookies
								</h2>
								<p className="text-gray-700 mb-6">
									AudioScribe uses cookies and similar tracking technologies
									for various purposes, including to enhance functionality,
									analyze usage patterns, and provide personalized experiences.
									We are committed to using these technologies responsibly and
									transparently.
								</p>

								<h2 className="text-2xl font-bold text-gray-900 mb-4">
									3. Types of Cookies We Use
								</h2>

								<h3 className="text-xl font-semibold text-gray-900 mb-3">
									Essential Cookies
								</h3>
								<p className="text-gray-700 mb-4">
									These cookies are necessary for the website to function and
									cannot be switched off in our systems. They are usually only
									set in response to actions made by you which amount to a
									request for services.
								</p>
								<ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
									<li>Authentication and security cookies</li>
									<li>Session management cookies</li>
									<li>Load balancing cookies</li>
								</ul>

								<h3 className="text-xl font-semibold text-gray-900 mb-3">
									Functional Cookies
								</h3>
								<p className="text-gray-700 mb-4">
									These cookies enable the website to provide enhanced
									functionality and personalization. They may be set by us or
									by third party providers whose services we have added to our
									pages.
								</p>
								<ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
									<li>User preference cookies</li>
									<li>Language selection cookies</li>
									<li>Feature enablement cookies</li>
								</ul>

								<h3 className="text-xl font-semibold text-gray-900 mb-3">
									Analytics Cookies
								</h3>
								<p className="text-gray-700 mb-4">
									These cookies help us understand how visitors interact with
									our website by collecting and reporting information
									anonymously. This helps us improve our service.
								</p>
								<ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
									<li>Usage analytics and performance monitoring</li>
									<li>Error tracking and debugging information</li>
									<li>Feature usage statistics</li>
								</ul>

								<h3 className="text-xl font-semibold text-gray-900 mb-3">
									Payment Processing Cookies
								</h3>
								<p className="text-gray-700 mb-6">
									We use Lemon Squeezy, LLC for payment processing, which may set its own
									cookies to facilitate secure transactions and prevent fraud.
									These cookies are essential for payment functionality.
								</p>

								<h2 className="text-2xl font-bold text-gray-900 mb-4">
									4. Third-Party Cookies
								</h2>
								<p className="text-gray-700 mb-4">
									We may use services from third-party providers that set
									their own cookies. These include:
								</p>
								<ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
									<li>
										<strong>Lemon Squeezy, LLC:</strong> Payment processing and
										subscription management
									</li>
									<li>
										<strong>Clerk:</strong> User authentication and account
										management
									</li>
									<li>
										<strong>Analytics Services:</strong> To understand usage
										patterns and improve our service
									</li>
								</ul>

								<h2 className="text-2xl font-bold text-gray-900 mb-4">
									5. Cookie Duration
								</h2>
								<p className="text-gray-700 mb-4">Cookies can be categorized by how long they last:</p>
								<ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
									<li>
										<strong>Session Cookies:</strong> These are temporary and
										are deleted when you close your browser
									</li>
									<li>
										<strong>Persistent Cookies:</strong> These remain on your
										device for a set period or until you delete them
									</li>
								</ul>

								<h2 className="text-2xl font-bold text-gray-900 mb-4">
									6. Managing Your Cookie Preferences
								</h2>
								<p className="text-gray-700 mb-6">
									You have several options for managing cookies:
								</p>

								<h3 className="text-xl font-semibold text-gray-900 mb-3">
									Browser Settings
								</h3>
								<p className="text-gray-700 mb-4">
									Most web browsers allow you to control cookies through their
									settings preferences. You can:
								</p>
								<ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
									<li>View cookies stored on your device</li>
									<li>Delete existing cookies</li>
									<li>Block cookies from being set</li>
									<li>Set preferences for specific websites</li>
								</ul>

								<h3 className="text-xl font-semibold text-gray-900 mb-3">
									Impact of Disabling Cookies
								</h3>
								<p className="text-gray-700 mb-6">
									Please note that disabling certain cookies may affect the
									functionality of our website. Essential cookies are required
									for basic functionality, and disabling them may prevent you
									from using certain features of AudioScribe.
								</p>

								<h2 className="text-2xl font-bold text-gray-900 mb-4">
									7. Updates to This Cookie Policy
								</h2>
								<p className="text-gray-700 mb-6">
									We may update this Cookie Policy from time to time to
									reflect changes in our practices or for other operational,
									legal, or regulatory reasons. We will notify you of material
									changes by posting the updated policy on our website.
								</p>

								<h2 className="text-2xl font-bold text-gray-900 mb-4">
									8. Contact Us
								</h2>
								<p className="text-gray-700 mb-6">
									If you have any questions about our use of cookies or this
									Cookie Policy, please contact us through our website or
									support channels. We're happy to help you understand how we
									use cookies and how you can manage your preferences.
								</p>

								<div className="border-t border-gray-200 pt-8 mt-12">
									<p className="text-sm text-gray-500 text-center">
										This Cookie Policy complements our Privacy Policy and
										Terms of Service, working together with Lemon Squeezy payment
										processing and Clerk authentication services.
									</p>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>
			</section>
		</div>
	);
}
