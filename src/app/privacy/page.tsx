"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Shield } from "lucide-react";

export default function PrivacyPolicyPage() {
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
								<Shield className="w-3 h-3 mr-1" />
								Privacy
							</Badge>
							<h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl max-w-5xl">
								Privacy Policy
							</h1>
							<p className="mx-auto max-w-2xl text-lg md:text-xl text-gray-600 leading-relaxed">
								Your privacy is important to us. Learn how we collect, use, and protect your data.
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
									1. Introduction
								</h2>
								<p className="text-gray-700 mb-6">
									AudioScribe ("we," "our," or "us") is committed to protecting
									your privacy. This Privacy Policy explains how we collect,
									use, disclose, and safeguard your information when you use our
									transcription service. Please read this policy carefully.
								</p>

								<h2 className="text-2xl font-bold text-gray-900 mb-4">
									2. Information We Collect
								</h2>

								<h3 className="text-xl font-semibold text-gray-900 mb-3">
									Personal Information
								</h3>
								<p className="text-gray-700 mb-4">We may collect:</p>
								<ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
									<li>Name and email address when you create an account</li>
									<li>Payment information processed through Paddle</li>
									<li>Communication preferences and support inquiries</li>
								</ul>

								<h3 className="text-xl font-semibold text-gray-900 mb-3">
									Usage Information
								</h3>
								<ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
									<li>Audio files you upload for transcription</li>
									<li>Transcription results and edits you make</li>
									<li>Usage patterns, feature usage, and service interactions</li>
									<li>Device information, IP address, and browser details</li>
								</ul>

								<h2 className="text-2xl font-bold text-gray-900 mb-4">
									3. How We Use Your Information
								</h2>
								<p className="text-gray-700 mb-4">We use the information we collect to:</p>
								<ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
									<li>Provide and maintain our transcription services</li>
									<li>Process your audio files and generate transcriptions</li>
									<li>Process payments through Paddle, our payment processor</li>
									<li>Send you important service updates and notifications</li>
									<li>Improve our services and develop new features</li>
									<li>Provide customer support and respond to inquiries</li>
									<li>Comply with legal obligations and protect our rights</li>
								</ul>

								<h2 className="text-2xl font-bold text-gray-900 mb-4">
									4. Data Processing and Storage
								</h2>
								<p className="text-gray-700 mb-6">
									Your audio files are processed using secure AI models to
									generate transcriptions. Audio files and transcriptions are
									automatically deleted from our servers according to our data
									retention schedule (typically within 30 days of processing).
									We use industry-standard security measures to protect your
									data during processing and storage.
								</p>

								<h2 className="text-2xl font-bold text-gray-900 mb-4">
									5. Information Sharing and Disclosure
								</h2>
								<p className="text-gray-700 mb-4">We may share your information with:</p>
								<ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
									<li>
										<strong>Lemon Squeezy, LLC:</strong> Our payment processor, for
										handling subscriptions and payments
									</li>
									<li>
										<strong>Service Providers:</strong> Trusted third parties
										that assist in operating our service
									</li>
									<li>
										<strong>Legal Requirements:</strong> When required by law
										or to protect our rights
									</li>
								</ul>
								<p className="text-gray-700 mb-6">
									We do not sell, rent, or share your personal information with
									third parties for their marketing purposes.
								</p>

								<h2 className="text-2xl font-bold text-gray-900 mb-4">
									6. Cookies and Tracking Technologies
								</h2>
								<p className="text-gray-700 mb-6">
									We use cookies and similar tracking technologies to enhance
									your experience, analyze usage patterns, and provide
									personalized content. You can control cookie preferences
									through your browser settings. Please see our Cookie Policy
									for more detailed information.
								</p>

								<h2 className="text-2xl font-bold text-gray-900 mb-4">
									7. Data Security
								</h2>
								<p className="text-gray-700 mb-6">
									We implement appropriate technical and organizational security
									measures to protect your personal information against
									unauthorized access, alteration, disclosure, or destruction.
									However, no internet transmission or electronic storage is
									100% secure, and we cannot guarantee absolute security.
								</p>

								<h2 className="text-2xl font-bold text-gray-900 mb-4">
									8. Data Retention
								</h2>
								<p className="text-gray-700 mb-6">
									We retain personal information only as long as necessary to
									provide our services and fulfill the purposes outlined in this
									policy. Audio files and transcriptions are automatically
									deleted according to our retention schedule. Account
									information is retained until you close your account.
								</p>

								<h2 className="text-2xl font-bold text-gray-900 mb-4">
									9. Your Privacy Rights
								</h2>
								<p className="text-gray-700 mb-4">
									Depending on your location, you may have the right to:
								</p>
								<ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
									<li>Access, update, or delete your personal information</li>
									<li>Restrict or object to processing of your data</li>
									<li>Data portability and withdrawal of consent</li>
									<li>Lodge a complaint with a supervisory authority</li>
								</ul>
								<p className="text-gray-700 mb-6">
									To exercise these rights, please contact us through our
									support channels.
								</p>

								<h2 className="text-2xl font-bold text-gray-900 mb-4">
									10. International Data Transfers
								</h2>
								<p className="text-gray-700 mb-6">
									Your information may be transferred to and processed in
									countries other than your own. We ensure appropriate
									safeguards are in place to protect your information in
									accordance with this Privacy Policy.
								</p>

								<h2 className="text-2xl font-bold text-gray-900 mb-4">
									11. Children's Privacy
								</h2>
								<p className="text-gray-700 mb-6">
									Our services are not directed to children under 13 years of
									age. We do not knowingly collect personal information from
									children under 13. If we become aware that we have collected
									such information, we will take steps to delete it promptly.
								</p>

								<h2 className="text-2xl font-bold text-gray-900 mb-4">
									12. Third-Party Links and Services
								</h2>
								<p className="text-gray-700 mb-6">
									Our service may contain links to third-party websites or
									services, including Lemon Squeezy for payment processing. This
									Privacy Policy does not apply to such third-party services.
									We encourage you to review their privacy policies.
								</p>

								<h2 className="text-2xl font-bold text-gray-900 mb-4">
									13. Changes to This Privacy Policy
								</h2>
								<p className="text-gray-700 mb-6">
									We may update this Privacy Policy from time to time. We will
									notify you of material changes by posting the new Privacy
									Policy on our website and updating the "Last updated" date.
									Your continued use of the service constitutes acceptance of
									the updated policy.
								</p>

								<h2 className="text-2xl font-bold text-gray-900 mb-4">
									14. Contact Information
								</h2>
								<p className="text-gray-700 mb-6">
									If you have questions about this Privacy Policy or our data
									practices, please contact us through our website or support
									channels. We will respond to your inquiry within a reasonable
									timeframe.
								</p>

								<div className="border-t border-gray-200 pt-8 mt-12">
									<p className="text-sm text-gray-500 text-center">
										This Privacy Policy is designed to comply with GDPR, CCPA,
										and other privacy regulations while working with Lemon Squeezy
										payment processing.
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