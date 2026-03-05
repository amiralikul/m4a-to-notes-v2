"use client";

import { Loader2, Sparkles } from "lucide-react";
import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
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
import { Textarea } from "@/components/ui/textarea";

type AnalysisStatus = "queued" | "processing" | "completed" | "failed";
type JobSourceType = "url" | "text";

interface AnalysisResultDay {
	day: number;
	title: string;
	tasks: string[];
}

interface AnalysisResult {
	compatibilityScore: number;
	compatibilitySummary: string;
	strengths: string[];
	gaps: string[];
	interviewQuestions: string[];
	interviewPreparation: string[];
	oneWeekPlan: AnalysisResultDay[];
}

interface AnalysisResponse {
	analysisId: string;
	status: AnalysisStatus;
	jobSourceType: JobSourceType;
	jobUrl: string | null;
	compatibilityScore: number | null;
	result: AnalysisResult | null;
	error: {
		code?: string | null;
		message?: string | null;
	} | null;
	createdAt: string;
	startedAt: string | null;
	completedAt: string | null;
	updatedAt: string;
}

const analysisKeys = {
	all: ["job-analyses"] as const,
	detail: (id: string) => [...analysisKeys.all, id] as const,
};

const statusStyles: Record<AnalysisStatus, string> = {
	queued: "bg-amber-100 text-amber-800 border-amber-200",
	processing: "bg-sky-100 text-sky-800 border-sky-200",
	completed: "bg-emerald-100 text-emerald-800 border-emerald-200",
	failed: "bg-rose-100 text-rose-800 border-rose-200",
};

async function createAnalysisApi(payload: {
	resumeText: string;
	jobUrl?: string;
	jobDescription?: string;
}): Promise<{ analysisId: string; status: string }> {
	const response = await fetch("/api/analyses", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(payload),
	});

	const body = (await response.json()) as {
		error?: string;
		analysisId?: string;
		status?: string;
	};

	if (!response.ok) {
		throw new Error(body.error || "Failed to start analysis");
	}

	return {
		analysisId: body.analysisId || "",
		status: body.status || "queued",
	};
}

async function fetchAnalysisApi(analysisId: string): Promise<AnalysisResponse> {
	const response = await fetch(`/api/analyses/${analysisId}`, {
		cache: "no-store",
	});

	const body = (await response.json()) as AnalysisResponse & { error?: string };
	if (!response.ok) {
		throw new Error(body.error || "Failed to fetch analysis status");
	}

	return body;
}

export default function JobMatchPage() {
	const [mode, setMode] = useState<JobSourceType>("url");
	const [resumeText, setResumeText] = useState("");
	const [jobUrl, setJobUrl] = useState("");
	const [jobDescription, setJobDescription] = useState("");
	const [activeAnalysisId, setActiveAnalysisId] = useState<string | null>(null);
	const [formError, setFormError] = useState<string | null>(null);

	const createMutation = useMutation({
		mutationFn: createAnalysisApi,
		onSuccess: (data) => {
			setActiveAnalysisId(data.analysisId);
			setFormError(null);
		},
		onError: (error) => {
			setFormError(error instanceof Error ? error.message : "Failed to start analysis");
		},
	});

	const analysisQuery = useQuery({
		queryKey: analysisKeys.detail(activeAnalysisId || "none"),
		queryFn: () => fetchAnalysisApi(activeAnalysisId as string),
		enabled: Boolean(activeAnalysisId),
		refetchInterval: (query) => {
			const status = query.state.data?.status;
			if (!status) return 4_000;
			if (status === "completed" || status === "failed") return false;
			return 4_000;
		},
	});

	const isSubmitting = createMutation.isPending;
	const currentStatus = analysisQuery.data?.status;
	const statusLabel = currentStatus
		? currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1)
		: null;

	function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setFormError(null);

		const trimmedResume = resumeText.trim();
		const trimmedJobUrl = jobUrl.trim();
		const trimmedJobDescription = jobDescription.trim();

		if (trimmedResume.length < 50) {
			setFormError("Resume text should be at least 50 characters.");
			return;
		}

		if (mode === "url") {
			if (!trimmedJobUrl) {
				setFormError("Please add a LinkedIn job URL.");
				return;
			}
			createMutation.mutate({
				resumeText: trimmedResume,
				jobUrl: trimmedJobUrl,
			});
			return;
		}

		if (trimmedJobDescription.length < 80) {
			setFormError("Job description should be at least 80 characters.");
			return;
		}

		createMutation.mutate({
			resumeText: trimmedResume,
			jobDescription: trimmedJobDescription,
		});
	}

	return (
		<main className="min-h-screen bg-gradient-to-b from-stone-50 via-emerald-50/40 to-stone-100 py-12 md:py-16">
			<div className="container max-w-5xl px-4 md:px-6 space-y-6">
				<div className="text-center space-y-3">
					<div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-100 px-3 py-1 text-sm text-emerald-800">
						<Sparkles className="h-3.5 w-3.5" />
						LinkedIn Job Match
					</div>
					<h1 className="text-3xl md:text-5xl font-display italic text-stone-900">
						Resume to Interview Plan
					</h1>
					<p className="mx-auto max-w-3xl text-stone-600">
						Paste your resume text, add a LinkedIn job URL or job description,
						and get compatibility, gaps, interview guidance, and a 1-week plan.
					</p>
				</div>

				<Card className="border-stone-200/70 shadow-sm">
					<CardHeader className="space-y-3">
						<CardTitle>Create Analysis</CardTitle>
						<CardDescription>
							For URL mode, only LinkedIn job links are supported in MVP.
						</CardDescription>
						<div className="flex flex-wrap gap-2">
							<Button
								type="button"
								variant={mode === "url" ? "default" : "outline"}
								onClick={() => setMode("url")}
							>
								LinkedIn URL
							</Button>
							<Button
								type="button"
								variant={mode === "text" ? "default" : "outline"}
								onClick={() => setMode("text")}
							>
								Pasted Job Description
							</Button>
						</div>
					</CardHeader>
					<CardContent>
						<form onSubmit={handleSubmit} className="space-y-4">
							<div className="space-y-2">
								<label htmlFor="resumeText" className="text-sm font-medium text-stone-700">
									Resume Text
								</label>
								<Textarea
									id="resumeText"
									value={resumeText}
									onChange={(event) => setResumeText(event.target.value)}
									placeholder="Paste resume text..."
									className="min-h-44 bg-white"
								/>
							</div>

							{mode === "url" ? (
								<div className="space-y-2">
									<label htmlFor="jobUrl" className="text-sm font-medium text-stone-700">
										LinkedIn Job URL
									</label>
									<Input
										id="jobUrl"
										type="url"
										value={jobUrl}
										onChange={(event) => setJobUrl(event.target.value)}
										placeholder="https://www.linkedin.com/jobs/view/..."
										className="bg-white"
									/>
								</div>
							) : (
								<div className="space-y-2">
									<label
										htmlFor="jobDescription"
										className="text-sm font-medium text-stone-700"
									>
										Job Description
									</label>
									<Textarea
										id="jobDescription"
										value={jobDescription}
										onChange={(event) => setJobDescription(event.target.value)}
										placeholder="Paste the full job description..."
										className="min-h-36 bg-white"
									/>
								</div>
							)}

							{formError && (
								<p className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-md px-3 py-2">
									{formError}
								</p>
							)}

							<div className="flex items-center gap-3">
								<Button type="submit" disabled={isSubmitting}>
									{isSubmitting ? (
										<>
											<Loader2 className="mr-2 h-4 w-4 animate-spin" />
											Submitting
										</>
									) : (
										"Start Analysis"
									)}
								</Button>
								{activeAnalysisId && (
									<span className="text-xs text-stone-500 font-mono">
										ID: {activeAnalysisId}
									</span>
								)}
							</div>
						</form>
					</CardContent>
				</Card>

				{analysisQuery.isFetching && !analysisQuery.data && (
					<Card className="border-stone-200/70">
						<CardContent className="py-8 flex items-center gap-3 text-stone-600">
							<Loader2 className="h-5 w-5 animate-spin" />
							Fetching analysis status...
						</CardContent>
					</Card>
				)}

				{analysisQuery.data && (
					<Card className="border-stone-200/70 shadow-sm">
						<CardHeader className="space-y-3">
							<div className="flex items-center gap-3">
								<CardTitle>Analysis Status</CardTitle>
								{currentStatus && statusLabel ? (
									<Badge className={statusStyles[currentStatus]}>{statusLabel}</Badge>
								) : null}
							</div>
							<CardDescription>
								{analysisQuery.data.error?.message ||
									(currentStatus === "completed"
										? "Analysis complete."
										: "Analysis is running in the background.")}
							</CardDescription>
						</CardHeader>

						{analysisQuery.data.result && currentStatus === "completed" && (
							<CardContent className="space-y-6">
								<div className="rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4">
									<p className="text-sm text-emerald-700">Compatibility Score</p>
									<p className="text-4xl font-semibold text-emerald-800">
										{analysisQuery.data.result.compatibilityScore}%
									</p>
									<p className="mt-2 text-sm text-emerald-900/90">
										{analysisQuery.data.result.compatibilitySummary}
									</p>
								</div>

								<div className="grid gap-4 md:grid-cols-2">
									<SimpleListCard
										title="Strengths"
										items={analysisQuery.data.result.strengths}
									/>
									<SimpleListCard
										title="Skill Gaps"
										items={analysisQuery.data.result.gaps}
									/>
								</div>

								<div className="grid gap-4 md:grid-cols-2">
									<SimpleListCard
										title="Likely Interview Questions"
										items={analysisQuery.data.result.interviewQuestions}
									/>
									<SimpleListCard
										title="Interview Preparation"
										items={analysisQuery.data.result.interviewPreparation}
									/>
								</div>

								<div className="space-y-3">
									<h3 className="text-lg font-semibold text-stone-900">1-Week Plan</h3>
									<div className="grid gap-3 md:grid-cols-2">
										{analysisQuery.data.result.oneWeekPlan.map((day) => (
											<div
												key={`day-${day.day}`}
												className="rounded-lg border border-stone-200 bg-white px-4 py-3"
											>
												<p className="text-xs uppercase tracking-wide text-stone-500">
													Day {day.day}
												</p>
												<p className="text-sm font-medium text-stone-900 mt-1">
													{day.title}
												</p>
												<ul className="mt-2 list-disc pl-5 space-y-1 text-sm text-stone-700">
													{day.tasks.map((task) => (
														<li key={`${day.day}-${task}`}>{task}</li>
													))}
												</ul>
											</div>
										))}
									</div>
								</div>
							</CardContent>
						)}
					</Card>
				)}
			</div>
		</main>
	);
}

function SimpleListCard({
	title,
	items,
}: {
	title: string;
	items: string[];
}) {
	return (
		<div className="rounded-lg border border-stone-200 bg-white px-4 py-3">
			<h3 className="text-sm font-semibold text-stone-900">{title}</h3>
			<ul className="mt-2 list-disc pl-5 space-y-1 text-sm text-stone-700">
				{items.map((item) => (
					<li key={`${title}-${item}`}>{item}</li>
				))}
			</ul>
		</div>
	);
}
