import type { DashboardTranscriptionStatus } from "@/components/dashboard/types";

export const transcriptionStatusConfig = {
	pending: { label: "Pending", className: "bg-amber-100 text-amber-800" },
	processing: { label: "Processing", className: "bg-sky-100 text-sky-800" },
	completed: { label: "Completed", className: "bg-emerald-100 text-emerald-800" },
	failed: { label: "Failed", className: "bg-red-100 text-red-800" },
} as const;

export const summaryStatusConfig = {
	not_generated: {
		label: "Summary: Not generated",
		className: "bg-stone-100 text-stone-700",
	},
	pending: {
		label: "Summary: Pending",
		className: "bg-amber-100 text-amber-800",
	},
	processing: {
		label: "Summary: Generating",
		className: "bg-sky-100 text-sky-800",
	},
	completed: {
		label: "Summary: Ready",
		className: "bg-emerald-100 text-emerald-800",
	},
	failed: {
		label: "Summary: Failed",
		className: "bg-red-100 text-red-800",
	},
} as const;

export function getSummaryStatusConfig(
	status: DashboardTranscriptionStatus | null | undefined,
) {
	return status ? summaryStatusConfig[status] : summaryStatusConfig.not_generated;
}

export function getTranscriptionStatusConfig(
	status: DashboardTranscriptionStatus,
) {
	return transcriptionStatusConfig[status];
}
