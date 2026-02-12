import { FileAudio } from "lucide-react";
import Link from "next/link";



export const SiteFooter = () => {
	return (
        <footer className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white">
        <div className="container px-4 md:px-6 py-12">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <div className="md:col-span-2">
                    <div className="flex items-center mb-4">
                        <FileAudio className="h-8 w-8 mr-3 text-blue-400" />
                        <span className="font-bold text-2xl bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                            AudioScribe
                        </span>
                    </div>
                    <p className="text-gray-400 leading-relaxed max-w-md">
                        Transform your M4A audio files into accurate text transcriptions
                        with AI-powered precision. Simple, secure, and professional.
                    </p>
                </div>

                <div>
                    <h4 className="font-semibold mb-4 text-white">Product</h4>
                    <nav className="flex flex-col space-y-2">
                        <Link
                            className="text-gray-400 hover:text-white transition-colors"
                            href="/features"
                        >
                            Features
                        </Link>
                        <Link
                            className="text-gray-400 hover:text-white transition-colors"
                            href="/pricing"
                        >
                            Pricing
                        </Link>
                        <Link
                            className="text-gray-400 hover:text-white transition-colors"
                            href="/contact"
                        >
                            API Access
                        </Link>
                    </nav>
                </div>

                <div>
                    <h4 className="font-semibold mb-4 text-white">Support</h4>
                    <nav className="flex flex-col space-y-2">
                        <Link
                            className="text-gray-400 hover:text-white transition-colors"
                            href="/contact"
                        >
                            Help Center
                        </Link>
                        <Link
                            className="text-gray-400 hover:text-white transition-colors"
                            href="/contact"
                        >
                            Contact Us
                        </Link>
                        <Link
                            className="text-gray-400 hover:text-white transition-colors"
                            href="/about"
                        >
                            About Us
                        </Link>
                    </nav>
                </div>
            </div>

            <div className="border-t border-gray-700 mt-8 pt-8 flex flex-col sm:flex-row justify-between items-center">
                <p className="text-sm text-gray-400">
                    © 2024 AudioScribe. All rights reserved.
                </p>
                <nav className="flex gap-6 mt-4 sm:mt-0">
                    <Link
                        className="text-sm text-gray-400 hover:text-white transition-colors"
                        href="/terms"
                    >
                        Terms of Service
                    </Link>
                    <Link
                        className="text-sm text-gray-400 hover:text-white transition-colors"
                        href="/privacy"
                    >
                        Privacy Policy
                    </Link>
                    <Link
                        className="text-sm text-gray-400 hover:text-white transition-colors"
                        href="/cookies"
                    >
                        Cookie Policy
                    </Link>
                </nav>
            </div>
        </div>
    </footer>
	);
};



