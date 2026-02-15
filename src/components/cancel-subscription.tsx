"use client";

import { useUser } from "@clerk/nextjs";
import {
	AlertTriangle,
	CheckCircle,
	Clock,
	ExternalLink,
	Loader2,
	X,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

export function CancelSubscription({
	entitlements,
	onCancellationSuccess,
	className = "",
	variant = "outline",
	size = "default",
}: {
	entitlements?: any;
	onCancellationSuccess?: (method: string) => void;
	className?: string;
	variant?:
		| "default"
		| "destructive"
		| "outline"
		| "secondary"
		| "ghost"
		| "link";
	size?: "default" | "sm" | "lg" | "icon";
}) {
	const { user } = useUser();
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [cancellationMethod, setCancellationMethod] = useState("portal");
	const [cancellationReason, setCancellationReason] = useState("");
	const [isProcessing, setIsProcessing] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const canCancel =
		entitlements?.status &&
		["active", "trialing", "past_due"].includes(entitlements.status);
	const subscriptionId = entitlements?.meta?.subscriptionId;
	const periodEnd = entitlements?.meta?.renewsAt || entitlements?.meta?.endsAt;

	const handleCustomerPortal = async () => {
		if (!subscriptionId) {
			setError("Subscription ID not found. Please contact support.");
			return;
		}

		setIsProcessing(true);
		setError(null);

		try {
			const response = await fetch("/api/lemonsqueezy/portal", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ subscriptionId }),
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				throw new Error(
					errorData.error ||
						`Failed to generate portal URL: ${response.status}`,
				);
			}

			const data = await response.json();

			if (data.portalUrl) {
				window.open(data.portalUrl, "_blank");
				setIsDialogOpen(false);
			} else {
				throw new Error("Portal URL not received");
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : "An unknown error occurred");
		} finally {
			setIsProcessing(false);
		}
	};

	const handleDirectCancel = async () => {
		if (!subscriptionId) {
			setError("Subscription ID not found. Please contact support.");
			return;
		}

		setIsProcessing(true);
		setError(null);

		try {
			const response = await fetch("/api/lemonsqueezy/cancel", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ subscriptionId, cancellationReason }),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(
					errorData.error ||
						`Failed to cancel subscription: ${response.status}`,
				);
			}

			await response.json();

			setIsDialogOpen(false);
			if (onCancellationSuccess) {
				onCancellationSuccess("direct");
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : "An unknown error occurred");
		} finally {
			setIsProcessing(false);
		}
	};

	const resetDialog = () => {
		setCancellationMethod("portal");
		setCancellationReason("");
		setError(null);
		setIsProcessing(false);
	};

	if (!canCancel) {
		return null;
	}

	return (
		<Dialog
			open={isDialogOpen}
			onOpenChange={(open) => {
				setIsDialogOpen(open);
				if (!open) resetDialog();
			}}
		>
			<DialogTrigger asChild>
				<Button variant={variant} size={size} className={className}>
					Cancel Subscription
				</Button>
			</DialogTrigger>

			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<AlertTriangle className="w-5 h-5 text-orange-500" />
						Cancel Subscription
					</DialogTitle>
					<DialogDescription>
						Choose how you&apos;d like to cancel your subscription. Your access
						will continue until the end of your billing period.
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4">
					{/* Period End Warning */}
					{periodEnd && (
						<Card className="bg-orange-50 border-orange-200">
							<CardContent className="pt-4">
								<div className="flex items-center gap-2 text-orange-800 text-sm">
									<Clock className="w-4 h-4" />
									<span>
										Your subscription will remain active until{" "}
										<strong>{new Date(periodEnd).toLocaleDateString()}</strong>
									</span>
								</div>
							</CardContent>
						</Card>
					)}

					{/* Error Message */}
					{error && (
						<Card className="bg-red-50 border-red-200">
							<CardContent className="pt-4">
								<div className="flex items-center gap-2 text-red-800 text-sm">
									<X className="w-4 h-4" />
									<span>{error}</span>
								</div>
							</CardContent>
						</Card>
					)}

					{/* Cancellation Method Selection */}
					<div className="space-y-3">
						<div className="text-sm font-medium">
							Choose cancellation method:
						</div>

						{/* Customer Portal Option (Recommended) */}
						<Card
							className={`cursor-pointer transition-colors ${
								cancellationMethod === "portal"
									? "ring-2 ring-blue-500 bg-blue-50"
									: "hover:bg-gray-50"
							}`}
							onClick={() => setCancellationMethod("portal")}
						>
							<CardContent className="pt-4">
								<div className="flex items-start gap-3">
									<input
										type="radio"
										name="cancellation-method"
										value="portal"
										checked={cancellationMethod === "portal"}
										onChange={() => setCancellationMethod("portal")}
										className="mt-1"
									/>
									<div className="flex-1">
										<div className="flex items-center gap-2 mb-1">
											<span className="font-medium">Customer Portal</span>
											<Badge className="bg-green-100 text-green-800 text-xs">
												Recommended
											</Badge>
										</div>
										<p className="text-sm text-gray-600">
											Manage your subscription through Lemon Squeezy&apos;s
											customer portal. You can also update payment methods and
											download invoices.
										</p>
									</div>
									<ExternalLink className="w-4 h-4 text-gray-400 mt-1" />
								</div>
							</CardContent>
						</Card>

						{/* Direct Cancel Option */}
						<Card
							className={`cursor-pointer transition-colors ${
								cancellationMethod === "direct"
									? "ring-2 ring-blue-500 bg-blue-50"
									: "hover:bg-gray-50"
							}`}
							onClick={() => setCancellationMethod("direct")}
						>
							<CardContent className="pt-4">
								<div className="flex items-start gap-3">
									<input
										type="radio"
										name="cancellation-method"
										value="direct"
										checked={cancellationMethod === "direct"}
										onChange={() => setCancellationMethod("direct")}
										className="mt-1"
									/>
									<div className="flex-1">
										<div className="font-medium mb-1">Quick Cancel</div>
										<p className="text-sm text-gray-600">
											Cancel immediately without leaving the app. Optional: tell
											us why you&apos;re canceling.
										</p>
									</div>
								</div>
							</CardContent>
						</Card>
					</div>

					{/* Cancellation Reason (for direct method) */}
					{cancellationMethod === "direct" && (
						<div className="space-y-2">
							<label
								htmlFor="cancellation-reason"
								className="text-sm font-medium"
							>
								Why are you canceling? (Optional)
							</label>
							<Textarea
								id="cancellation-reason"
								placeholder="Help us improve by sharing your feedback..."
								value={cancellationReason}
								onChange={(e) => setCancellationReason(e.target.value)}
								className="resize-none"
								rows={3}
							/>
						</div>
					)}
				</div>

				<DialogFooter className="flex gap-2">
					<DialogClose asChild>
						<Button variant="outline" disabled={isProcessing}>
							Keep Subscription
						</Button>
					</DialogClose>

					<Button
						onClick={
							cancellationMethod === "portal"
								? handleCustomerPortal
								: handleDirectCancel
						}
						disabled={isProcessing}
						className="bg-red-600 hover:bg-red-700 text-white"
					>
						{isProcessing ? (
							<>
								<Loader2 className="w-4 h-4 mr-2 animate-spin" />
								Processing...
							</>
						) : cancellationMethod === "portal" ? (
							<>
								Open Portal
								<ExternalLink className="w-4 h-4 ml-2" />
							</>
						) : (
							"Cancel Subscription"
						)}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

export function CancellationSuccess({ method, onClose }: { method: string; onClose?: () => void }) {
	return (
		<Card className="bg-green-50 border-green-200">
			<CardContent className="pt-6">
				<div className="flex items-center gap-3">
					<CheckCircle className="w-5 h-5 text-green-600" />
					<div className="flex-1">
						<h3 className="font-medium text-green-800">
							Cancellation {method === "portal" ? "Portal Opened" : "Processed"}
						</h3>
						<p className="text-sm text-green-700 mt-1">
							{method === "portal"
								? "Please complete the cancellation in the opened portal tab."
								: "Your subscription has been scheduled for cancellation at the end of your billing period."}
						</p>
					</div>
					{onClose && (
						<Button
							variant="ghost"
							size="sm"
							onClick={onClose}
							className="text-green-600 hover:text-green-700"
						>
							<X className="w-4 h-4" />
						</Button>
					)}
				</div>
			</CardContent>
		</Card>
	);
}
