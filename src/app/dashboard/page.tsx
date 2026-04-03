import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { DashboardWorkspace } from "@/components/dashboard/dashboard-workspace";

export default function DashboardPage() {
	return (
		<Suspense
			fallback={
				<div className="flex min-h-screen items-center justify-center">
					<Loader2 className="size-6 animate-spin text-stone-400" />
				</div>
			}
		>
			<DashboardWorkspace />
		</Suspense>
	);
}
