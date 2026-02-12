import { CheckCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

export default function CheckoutSuccessPage() {
	return (
		<div className="container mx-auto px-4 py-8">
			<div className="max-w-2xl mx-auto text-center space-y-8">
				<div className="space-y-4">
					<div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
						<CheckCircle className="w-8 h-8 text-green-600" />
					</div>
					<h1 className="text-3xl font-bold">Payment Successful!</h1>
					<p className="text-muted-foreground">
						Thank you for your purchase. Your subscription is now active.
					</p>
				</div>

				<Card>
					<CardHeader>
						<CardTitle>What happens next?</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4 text-left">
						<div className="space-y-2">
							<h4 className="font-medium">✅ Account Activated</h4>
							<p className="text-sm text-muted-foreground">
								Your subscription has been activated and you now have access to
								all premium features.
							</p>
						</div>

						<div className="space-y-2">
							<h4 className="font-medium">📧 Confirmation Email</h4>
							<p className="text-sm text-muted-foreground">
								You'll receive a confirmation email with your receipt and
								subscription details.
							</p>
						</div>

						<div className="space-y-2">
							<h4 className="font-medium">🚀 Start Transcribing</h4>
							<p className="text-sm text-muted-foreground">
								You can now upload and transcribe your audio files with premium
								features enabled.
							</p>
						</div>
					</CardContent>
				</Card>

				<div className="space-x-4">
					<Link href="/">
						<Button size="lg">Start Transcribing</Button>
					</Link>
					<Link href="/subscription">
						<Button variant="outline" size="lg">
							Manage Subscription
						</Button>
					</Link>
				</div>
			</div>
		</div>
	);
}
