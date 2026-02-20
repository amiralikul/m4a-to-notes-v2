"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Scale } from "lucide-react";

export default function TermsOfServicePage() {
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
								<Scale className="w-3 h-3 mr-1" />
								Legal
							</Badge>
							<h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl max-w-5xl">
								Terms of Service
							</h1>
							<p className="mx-auto max-w-2xl text-lg md:text-xl text-gray-600 leading-relaxed">
								Please read these terms carefully before using AudioScribe
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
									1. Agreement to Terms
								</h2>
								<p className="text-gray-700 mb-6">
									By accessing or using AudioScribe ("the Service"), you agree
									to be bound by these Terms of Service ("Terms"). If you do not
									agree to these Terms, you may not use the Service.
								</p>

								<h2 className="text-2xl font-bold text-gray-900 mb-4">
									2. Description of Service
								</h2>
								<p className="text-gray-700 mb-6">
									AudioScribe is an AI-powered transcription service that
									converts audio files (including FLAC, MP3, MP4, MPEG, MPGA, M4A, OGG, WAV, and WebM formats) into text. The
									Service is provided through our website and may include
									additional features such as file management, editing tools,
									and export options.
								</p>

								<h2 className="text-2xl font-bold text-gray-900 mb-4">
									3. User Accounts and Registration
								</h2>
								<p className="text-gray-700 mb-6">
									To use certain features of the Service, you must create an
									account. You are responsible for maintaining the
									confidentiality of your account credentials and for all
									activities that occur under your account. You must provide
									accurate and complete information when creating your account.
								</p>

								<h2 className="text-2xl font-bold text-gray-900 mb-4">
									4. Payment Terms
								</h2>
								<p className="text-gray-700 mb-6">
									Payment processing is handled by Lemon Squeezy, LLC, our
									authorized payment processor. By making a payment, you agree to
									Lemon Squeezy's terms and conditions. All fees are
									non-refundable unless otherwise stated in our refund policy.
									Subscription fees are charged on a recurring basis until
									cancelled.
								</p>

								<h2 className="text-2xl font-bold text-gray-900 mb-4">
									5. Acceptable Use Policy
								</h2>
								<p className="text-gray-700 mb-4">You agree not to:</p>
								<ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
									<li>
										Upload content that is illegal, harmful, threatening,
										abusive, or violates any laws
									</li>
									<li>
										Infringe on intellectual property rights of others
									</li>
									<li>
										Attempt to gain unauthorized access to the Service or other
										users' accounts
									</li>
									<li>Use the Service for any commercial purposes without our written consent</li>
									<li>Upload malicious code or attempt to disrupt the Service</li>
									<li>Reverse engineer, decompile, or disassemble the Service</li>
								</ul>

								<h2 className="text-2xl font-bold text-gray-900 mb-4">
									6. Content and Privacy
								</h2>
								<p className="text-gray-700 mb-6">
									You retain ownership of the content you upload to AudioScribe.
									However, you grant us a limited license to process, store, and
									transcribe your content to provide the Service. We automatically
									delete uploaded files and transcriptions according to our
									retention policy. Please refer to our Privacy Policy for
									detailed information about how we handle your data.
								</p>

								<h2 className="text-2xl font-bold text-gray-900 mb-4">
									7. Service Availability and Modifications
								</h2>
								<p className="text-gray-700 mb-6">
									We strive to maintain high availability of the Service but
									cannot guarantee uninterrupted access. We reserve the right to
									modify, suspend, or discontinue any aspect of the Service at
									any time with or without notice.
								</p>

								<h2 className="text-2xl font-bold text-gray-900 mb-4">
									8. Limitation of Liability
								</h2>
								<p className="text-gray-700 mb-6">
									TO THE MAXIMUM EXTENT PERMITTED BY LAW, AUDIOSCRIBE SHALL NOT
									BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL,
									OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES,
									WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA,
									USE, GOODWILL, OR OTHER INTANGIBLE LOSSES.
								</p>

								<h2 className="text-2xl font-bold text-gray-900 mb-4">
									9. Indemnification
								</h2>
								<p className="text-gray-700 mb-6">
									You agree to indemnify and hold AudioScribe harmless from any
									claims, damages, or expenses arising from your use of the
									Service or violation of these Terms.
								</p>

								<h2 className="text-2xl font-bold text-gray-900 mb-4">
									10. Termination
								</h2>
								<p className="text-gray-700 mb-6">
									Either party may terminate this agreement at any time. Upon
									termination, your access to the Service will cease, and any
									data associated with your account may be deleted according to
									our data retention policy.
								</p>

								<h2 className="text-2xl font-bold text-gray-900 mb-4">
									11. Governing Law
								</h2>
								<p className="text-gray-700 mb-6">
									These Terms shall be governed by and construed in accordance
									with the laws of the jurisdiction in which AudioScribe
									operates, without regard to its conflict of law provisions.
								</p>

								<h2 className="text-2xl font-bold text-gray-900 mb-4">
									12. Changes to Terms
								</h2>
								<p className="text-gray-700 mb-6">
									We reserve the right to modify these Terms at any time. We
									will notify users of material changes via email or through the
									Service. Your continued use of the Service after such
									modifications constitutes acceptance of the updated Terms.
								</p>

								<h2 className="text-2xl font-bold text-gray-900 mb-4">
									13. Contact Information
								</h2>
								<p className="text-gray-700 mb-6">
									If you have any questions about these Terms of Service, please
									contact us through our website or support channels.
								</p>

								<div className="border-t border-gray-200 pt-8 mt-12">
									<p className="text-sm text-gray-500 text-center">
										These terms are designed to work with Lemon Squeezy payment processing
										and comply with standard SaaS service requirements.
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
