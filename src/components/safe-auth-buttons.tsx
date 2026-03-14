"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function SafeAuthButtons() {
	const { isLoaded, isSignedIn, user } = useAuth();
	const router = useRouter();

	if (!isLoaded) {
		return (
			<div className="flex items-center gap-4">
				<div className="h-9 w-16 bg-stone-200 animate-pulse rounded-lg" />
				<div className="h-9 w-20 bg-stone-200 animate-pulse rounded-lg" />
			</div>
		);
	}

	if (isSignedIn) {
		return (
			<DropdownMenu>
				<DropdownMenuTrigger
					className="cursor-pointer rounded-full"
					aria-label={`Open account menu for ${user?.name ?? "account"}`}
				>
					<Avatar>
						<AvatarImage src={user?.image ?? undefined} />
						<AvatarFallback>
							{user?.name?.slice(0, 1).toUpperCase() ?? "A"}
						</AvatarFallback>
					</Avatar>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end">
					<DropdownMenuItem
						onClick={async () => {
							await authClient.signOut();
							router.refresh();
						}}
					>
						Sign Out
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
		);
	}

	return (
		<>
			<Link
				href="/auth"
				className="text-sm text-stone-500 hover:text-stone-900 transition-colors cursor-pointer font-medium"
			>
				Sign In
			</Link>
			<Link
				href="/auth?tab=signup"
				className="bg-stone-900 text-stone-50 rounded-lg font-medium text-sm h-9 px-4 inline-flex items-center cursor-pointer hover:bg-stone-800 transition-colors"
			>
				Sign Up
			</Link>
		</>
	);
}
