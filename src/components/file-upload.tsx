"use client";
import { useUser } from "@clerk/nextjs";
import {
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import {
	AlertCircle,
	CheckCircle,
	Download,
	FileAudio,
	Loader2,
	Play,
	RotateCcw,
	Trash2,
	Upload,
	Users,
	X,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { upload } from "@vercel/blob/client";
import { logger } from "@/lib/logger";
import { viewerTranscriptionKeys } from "@/lib/query-keys";
import { TRIAL_ERROR_CODES } from "@/lib/trial-errors";
import {
	AUDIO_LIMITS,
	SUPPORTED_AUDIO_FORMATS_TEXT,
} from "@/lib/validation";
import { AudioPlayer } from "@/components/audio-player";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";

interface UploadedFile {
	id: string;
	file: File;
	status: "uploading" | "processing" | "completed" | "error";
	progress: number;
	transcription?: string;
	transcriptionId?: string;
	audioUrl?: string;
	error?: string;
}

interface ChunkManifestItem {
	chunkIndex: number;
	blobUrl: string;
	startMs: number;
	endMs: number;
}

interface ChunkerResponsePayload {
	chunks?: ChunkManifestItem[];
	error?: string;
}

interface PreviousTranscription {
	id: string;
	filename: string;
	status: "pending" | "processing" | "completed" | "failed";
	progress: number;
	preview: string | null;
	audioKey: string | null;
	createdAt: string;
}

interface FileUploadProps {
	showHistory?: boolean;
}

const DAILY_LIMIT_MESSAGE = "Daily free limit reached (3 files/day).";
const DAILY_LIMIT_EXPLANATION =
	"You have used all 3 free transcriptions for today. The limit resets daily (UTC). Upgrade to Pro to continue now.";
const BLOB_RATE_LIMIT_CODE = "rate_limited";
const CHUNKER_RATE_LIMIT_CODE = "chunker_rate_limited";
const MAX_CHUNKER_FILE_SIZE = 1024 * 1024 * 1024;
const RECENT_TRANSCRIPTIONS_LIMIT = 10;
const CHUNKER_CHUNK_SECONDS = 10 * 60; //FIXME
const CHUNKER_OVERLAP_SECONDS = 10;
const AUDIO_CHUNKER_URL = process.env.NEXT_PUBLIC_AUDIO_CHUNKER_URL;

function isDailyLimitErrorMessage(message: string): boolean {
	const normalized = message.toLowerCase();
	return (
		normalized.includes(TRIAL_ERROR_CODES.DAILY_LIMIT_REACHED.toLowerCase()) ||
		normalized.includes("daily free limit") ||
		normalized.includes("failed to retrieve the client token") ||
		normalized.includes("status code: 429")
	);
}

type ClientError = Error & { code?: string };

function createCodedError(message: string, code?: string): ClientError {
	const error = new Error(message) as ClientError;
	error.code = code;
	return error;
}

function isDailyLimitError(error: unknown): boolean {
	if (
		typeof error === "object" &&
		error !== null &&
		"code" in error &&
		typeof (error as { code?: unknown }).code === "string"
	) {
		const code = (error as { code?: string }).code;
		if (
			code === TRIAL_ERROR_CODES.DAILY_LIMIT_REACHED ||
			code === BLOB_RATE_LIMIT_CODE ||
			code === CHUNKER_RATE_LIMIT_CODE
		) {
			return true;
		}
	}

	if (error instanceof Error) {
		const code = (error as ClientError).code;
		return (
			code === TRIAL_ERROR_CODES.DAILY_LIMIT_REACHED ||
			code === BLOB_RATE_LIMIT_CODE ||
			code === CHUNKER_RATE_LIMIT_CODE ||
			isDailyLimitErrorMessage(error.message)
		);
	}
	return false;
}

async function fetchPreviousTranscriptionsApi(
	limit: number,
): Promise<PreviousTranscription[]> {
	const response = await fetch(`/api/me/transcriptions?limit=${limit}`, {
		cache: "no-store",
	});
	if (!response.ok) {
		throw new Error("Could not load transcriptions right now.");
	}

	const data = (await response.json()) as {
		transcriptions?: PreviousTranscription[];
	};
	return data.transcriptions || [];
}

async function deletePreviousTranscriptionApi(
	transcriptionId: string,
): Promise<void> {
	const response = await fetch(`/api/me/transcriptions/${transcriptionId}`, {
		method: "DELETE",
	});
	if (!response.ok) {
		throw new Error("Could not delete transcription right now. Please try again.");
	}
}

export default function FileUpload({
	showHistory = true,
}: FileUploadProps) {
	const { isLoaded, isSignedIn } = useUser();
	const queryClient = useQueryClient();
	const recentTranscriptionsQueryKey = viewerTranscriptionKeys.list(
		RECENT_TRANSCRIPTIONS_LIMIT,
	);
	const [isDragOver, setIsDragOver] = useState(false);
	const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
	const [deletingPreviousIds, setDeletingPreviousIds] = useState<Set<string>>(
		new Set(),
	);
	const [historyActionError, setHistoryActionError] = useState<string | null>(
		null,
	);
	const [pendingFiles, setPendingFiles] = useState<File[]>([]);
	const [dialogOpen, setDialogOpen] = useState(false);
	const [enableDiarization, setEnableDiarization] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const abortControllerRef = useRef<AbortController | null>(null);
	const pollTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

	const cleanupPendingWork = useCallback(() => {
		abortControllerRef.current?.abort();
		for (const timeout of pollTimeoutsRef.current.values()) {
			clearTimeout(timeout);
		}
	}, []);

	useEffect(() => {
		return cleanupPendingWork;
	}, [cleanupPendingWork]);

	const handleDragOver = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		setIsDragOver(true);
	}, []);

	const handleDragLeave = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		setIsDragOver(false);
	}, []);

	const validateFile = useCallback((file: File) => {
		const extension = `.${file.name.split(".").pop()?.toLowerCase()}`;
		const isSupportedFormat =
			AUDIO_LIMITS.VALID_MIME_TYPES.includes(file.type) ||
			AUDIO_LIMITS.VALID_EXTENSIONS.includes(extension);

		if (!isSupportedFormat) {
			alert(`Supported formats: ${SUPPORTED_AUDIO_FORMATS_TEXT}.`);
			return false;
		}

		if (file.name.length > AUDIO_LIMITS.MAX_FILENAME_LENGTH) {
			alert("Filename too long.");
			return false;
		}

		const maximumAllowedSize = AUDIO_CHUNKER_URL
			? MAX_CHUNKER_FILE_SIZE
			: AUDIO_LIMITS.MAX_FILE_SIZE;

		if (file.size > maximumAllowedSize) {
			alert(
				`File size exceeds ${maximumAllowedSize / 1024 / 1024}MB limit.`,
			);
			return false;
		}

		return true;
	}, []);

	const formatFileSize = (bytes: number) => {
		if (bytes === 0) return "0 Bytes";
		const k = 1024;
		const sizes = ["Bytes", "KB", "MB", "GB"];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
	};

	const pollTranscriptionStatus = useCallback(
		(fileId: string, transcriptionId: string) => {
			const MAX_POLLING_TIME = 10 * 60 * 1000;
			const POLL_INTERVAL = 2000;
			let pollCount = 0;
			const maxPollCount = MAX_POLLING_TIME / POLL_INTERVAL;

			const poll = async () => {
				pollCount++;

				if (pollCount >= maxPollCount) {
					setUploadedFiles((prev) =>
						prev.map((f) =>
							f.id === fileId
								? {
										...f,
										status: "error" as const,
										progress: 0,
										error:
											"Transcription timed out after 10 minutes. Please try again.",
									}
								: f,
						),
					);
					return;
				}

				try {
					const response = await fetch(
						`/api/transcriptions/${transcriptionId}`,
					);
					const transcriptionStatus = await response.json();

					if (!response.ok) {
						throw new Error(
							transcriptionStatus.error ||
								"Failed to get transcription status",
						);
					}

					setUploadedFiles((prev) =>
						prev.map((f) =>
							f.id === fileId
								? { ...f, progress: transcriptionStatus.progress || 50 }
								: f,
						),
					);

					if (transcriptionStatus.status === "completed") {
						let transcriptText = transcriptionStatus.preview || "";

						try {
							const transcriptResponse = await fetch(
								`/api/transcriptions/${transcriptionId}/transcript`,
							);
							if (transcriptResponse.ok) {
								transcriptText = await transcriptResponse.text();
							}
						} catch {
							transcriptText =
								transcriptionStatus.preview ||
								"Transcription completed but text unavailable";
						}

						setUploadedFiles((prev) =>
							prev.map((f) =>
								f.id === fileId
									? {
											...f,
											status: "completed" as const,
											progress: 100,
											transcription: transcriptText,
											transcriptionId,
										}
									: f,
							),
						);
					} else if (
						transcriptionStatus.status === "error" ||
						transcriptionStatus.status === "failed"
					) {
						setUploadedFiles((prev) =>
							prev.map((f) =>
								f.id === fileId
									? {
											...f,
											status: "error" as const,
											progress: 0,
											error:
												transcriptionStatus.error?.message ||
												"Transcription failed",
										}
									: f,
							),
						);
					} else {
						const timeout = setTimeout(poll, POLL_INTERVAL);
						pollTimeoutsRef.current.set(fileId, timeout);
					}
				} catch {
					setUploadedFiles((prev) =>
						prev.map((f) =>
							f.id === fileId
								? {
										...f,
										status: "error" as const,
										progress: 0,
										error: "Failed to get transcription status",
									}
								: f,
						),
					);
				}
			};

			const timeout = setTimeout(poll, 1000);
			pollTimeoutsRef.current.set(fileId, timeout);
		},
		[],
	);

	const {
		data: previousTranscriptions = [],
		isLoading: loadingPreviousTranscriptions,
		isFetching: fetchingPreviousTranscriptions,
		error: previousTranscriptionsQueryError,
		refetch: refetchPreviousTranscriptions,
	} = useQuery({
		queryKey: recentTranscriptionsQueryKey,
		queryFn: () =>
			fetchPreviousTranscriptionsApi(RECENT_TRANSCRIPTIONS_LIMIT),
		enabled: showHistory && isLoaded,
		staleTime: 20_000,
		gcTime: 10 * 60 * 1000,
		retry: 1,
	});

	const { mutateAsync: deletePreviousTranscription } = useMutation({
		mutationFn: deletePreviousTranscriptionApi,
		onMutate: async (transcriptionId) => {
			await queryClient.cancelQueries({
				queryKey: viewerTranscriptionKeys.lists(),
			});
			const previous = queryClient.getQueryData<PreviousTranscription[]>(
				recentTranscriptionsQueryKey,
			);

			queryClient.setQueryData<PreviousTranscription[]>(
				recentTranscriptionsQueryKey,
				(old) => (old || []).filter((item) => item.id !== transcriptionId),
			);

			return { previous };
		},
		onError: (_error, _transcriptionId, context) => {
			if (context?.previous) {
				queryClient.setQueryData(
					recentTranscriptionsQueryKey,
					context.previous,
				);
			}
			setHistoryActionError(
				"Could not delete transcription right now. Please try again.",
			);
		},
		onSuccess: () => {
			setHistoryActionError(null);
		},
		onSettled: () => {
			void queryClient.invalidateQueries({
				queryKey: viewerTranscriptionKeys.lists(),
			});
		},
	});

	const requestChunkManifest = useCallback(
		async (file: File): Promise<ChunkManifestItem[]> => {
			if (!AUDIO_CHUNKER_URL) {
				throw new Error(
					"Large-file transcription is not configured (missing NEXT_PUBLIC_AUDIO_CHUNKER_URL).",
				);
			}

			const formData = new FormData();
			formData.append("audio", file, file.name);
			formData.append("chunkSeconds", CHUNKER_CHUNK_SECONDS.toString());
			formData.append("overlapSeconds", CHUNKER_OVERLAP_SECONDS.toString());

			const response = await fetch(`${AUDIO_CHUNKER_URL}/chunk`, {
				method: "POST",
				body: formData,
			});

			let payload: ChunkerResponsePayload = {};
			try {
				payload = (await response.json()) as ChunkerResponsePayload;
			} catch {
				payload = {};
			}

			if (!response.ok) {
				const errorMessage =
					payload.error ||
					"Failed to chunk large audio file for transcription.";
				if (response.status === 429) {
					throw createCodedError(errorMessage, CHUNKER_RATE_LIMIT_CODE);
				}
				throw new Error(errorMessage);
			}

			const chunks = payload.chunks;
			if (!Array.isArray(chunks) || chunks.length === 0) {
				throw new Error("Chunker returned an empty or invalid chunk manifest.");
			}

			const isValidChunk = (value: ChunkManifestItem): boolean =>
				typeof value.chunkIndex === "number" &&
				typeof value.blobUrl === "string" &&
				typeof value.startMs === "number" &&
				typeof value.endMs === "number" &&
				value.endMs > value.startMs;

			if (!chunks.every((chunk) => isValidChunk(chunk))) {
				throw new Error("Chunker returned malformed chunk metadata.");
			}

			return chunks;
		},
		[],
	);

	const processFileWithAPI = useCallback(
		async (fileId: string, file: File) => {
			try {
				setUploadedFiles((prev) =>
					prev.map((f) =>
						f.id === fileId
							? { ...f, status: "uploading" as const, progress: 5 }
							: f,
					),
				);

				const quotaResponse = await fetch("/api/trial/quota", {
					method: "GET",
					cache: "no-store",
				});
				if (quotaResponse.status === 429) {
					const quotaPayload = (await quotaResponse.json()) as {
						error?: string;
						code?: string;
					};
					throw createCodedError(
						quotaPayload.error || DAILY_LIMIT_EXPLANATION,
						quotaPayload.code,
					);
				}

				const isLargeFile = file.size > AUDIO_LIMITS.MAX_FILE_SIZE;
				let startPayload:
					| {
							filename: string;
							enableDiarization: boolean;
							blobUrl: string;
					  }
					| {
							filename: string;
							chunks: ChunkManifestItem[];
					  };

				if (isLargeFile) {
					setUploadedFiles((prev) =>
						prev.map((f) =>
							f.id === fileId
								? {
										...f,
										status: "uploading" as const,
										progress: 10,
									}
								: f,
						),
					);

					const chunks = await requestChunkManifest(file);

					setUploadedFiles((prev) =>
						prev.map((f) =>
							f.id === fileId
								? {
										...f,
										status: "uploading" as const,
										progress: 15,
									}
								: f,
						),
					);

					startPayload = {
						filename: file.name,
						chunks,
					};
				} else {
					const blob = await upload(file.name, file, {
						access: "public",
						handleUploadUrl: "/api/upload",
						multipart: true,
					});

					setUploadedFiles((prev) =>
						prev.map((f) =>
							f.id === fileId
								? {
										...f,
										status: "uploading" as const,
										progress: 15,
										audioUrl: blob.url,
									}
								: f,
						),
					);

					startPayload = {
						blobUrl: blob.url,
						filename: file.name,
						enableDiarization,
					};
				}

				const response = await fetch("/api/start-transcription", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(startPayload),
				});

				const result = await response.json();

				if (!response.ok) {
					if (
						response.status === 429 ||
						result?.code === TRIAL_ERROR_CODES.DAILY_LIMIT_REACHED
					) {
						throw createCodedError(
							result?.error || DAILY_LIMIT_EXPLANATION,
							result?.code,
						);
					}

					throw new Error(
						result.error || "Failed to start transcription",
					);
				}

				setUploadedFiles((prev) =>
					prev.map((f) =>
						f.id === fileId
							? {
									...f,
									status: "processing" as const,
									progress: 20,
									transcriptionId: result.transcriptionId,
								}
							: f,
					),
				);

				setHistoryActionError(null);
				void queryClient.invalidateQueries({
					queryKey: viewerTranscriptionKeys.lists(),
				});
				pollTranscriptionStatus(fileId, result.transcriptionId);
			} catch (error) {
				logger.error("Failed to process upload", {
					error:
						error instanceof Error
							? error.message
							: "Unknown upload error",
				});
				const errorMessage = isDailyLimitError(error)
					? DAILY_LIMIT_EXPLANATION
					: error instanceof Error
						? error.message
						: "Failed to upload file. Please try again.";

				setUploadedFiles((prev) =>
					prev.map((f) =>
						f.id === fileId
							? {
									...f,
									status: "error" as const,
									progress: 0,
									error: errorMessage,
								}
							: f,
					),
				);
			}
		},
			[
				enableDiarization,
				pollTranscriptionStatus,
				queryClient,
				requestChunkManifest,
			],
		);

	const pendingFile = pendingFiles[0] ?? null;

	const startTranscription = useCallback(() => {
		if (!pendingFile) return;

		const file = pendingFile;
		const fileId = Math.random().toString(36).substr(2, 9);
		const uploadedFile: UploadedFile = {
			file,
			id: fileId,
			status: "uploading",
			progress: 0,
		};

		setUploadedFiles((prev) => [...prev, uploadedFile]);
		processFileWithAPI(fileId, file);

		setPendingFiles((prev) => {
			const remaining = prev.slice(1);
			if (remaining.length === 0) {
				setDialogOpen(false);
			} else {
				setEnableDiarization(false);
			}
			return remaining;
		});
	}, [pendingFile, processFileWithAPI]);

	const processFiles = useCallback(
		(files: FileList) => {
			const validFiles = Array.from(files).filter((file) =>
				validateFile(file),
			);
			if (validFiles.length === 0) return;

			setPendingFiles(validFiles);
			setEnableDiarization(false);
			setDialogOpen(true);
		},
		[validateFile],
	);

	const handleDrop = useCallback(
		(e: React.DragEvent) => {
			e.preventDefault();
			setIsDragOver(false);
			processFiles(e.dataTransfer.files);
		},
		[processFiles],
	);

	const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = e.target.files;
		if (files) {
			processFiles(files);
		}
		e.target.value = "";
	};

	const removeFile = (fileId: string) => {
		const timeout = pollTimeoutsRef.current.get(fileId);
		if (timeout) {
			clearTimeout(timeout);
			pollTimeoutsRef.current.delete(fileId);
		}
		setUploadedFiles((prev) => prev.filter((f) => f.id !== fileId));
	};

	const retryFile = useCallback(
		(fileId: string) => {
			setUploadedFiles((prev) =>
				prev.map((f) =>
					f.id === fileId
						? {
								...f,
								status: "uploading" as const,
								progress: 0,
								error: undefined,
								transcription: undefined,
								transcriptionId: undefined,
							}
						: f,
				),
			);

			const fileToRetry = uploadedFiles.find((f) => f.id === fileId);
			if (fileToRetry) {
				void processFileWithAPI(fileId, fileToRetry.file);
			}
		},
		[uploadedFiles, processFileWithAPI],
	);

	const hasDailyLimitError = uploadedFiles.some(
		(file) =>
			file.status === "error" &&
			file.error &&
			isDailyLimitErrorMessage(file.error),
	);
	const maxUploadSizeBytes = AUDIO_CHUNKER_URL
		? MAX_CHUNKER_FILE_SIZE
		: AUDIO_LIMITS.MAX_FILE_SIZE;
	const shouldShowPreviousTranscriptions =
		showHistory &&
		isLoaded &&
		(loadingPreviousTranscriptions ||
			Boolean(historyActionError) ||
			Boolean(previousTranscriptionsQueryError) ||
			previousTranscriptions.length > 0);
	const previousTranscriptionsError =
		historyActionError ||
		(previousTranscriptionsQueryError instanceof Error
			? previousTranscriptionsQueryError.message
			: null);

	const handleDeletePreviousTranscription = useCallback(
		async (transcriptionId: string) => {
			setDeletingPreviousIds((prev) => {
				const next = new Set(prev);
				next.add(transcriptionId);
				return next;
			});

				try {
					await deletePreviousTranscription(transcriptionId);
				} finally {
					setDeletingPreviousIds((prev) => {
						const next = new Set(prev);
						next.delete(transcriptionId);
						return next;
					});
				}
			},
			[deletePreviousTranscription],
		);

	const getStatusIcon = (status: UploadedFile["status"]) => {
		switch (status) {
			case "completed":
				return <CheckCircle className="h-4 w-4 text-emerald-500" />;
			case "error":
				return <AlertCircle className="h-4 w-4 text-red-500" />;
			default:
				return <FileAudio className="h-4 w-4 text-amber-500" />;
		}
	};

	const getStatusText = (status: UploadedFile["status"]) => {
		switch (status) {
			case "uploading":
				return "Uploading...";
			case "processing":
				return "Processing...";
			case "completed":
				return "Completed";
			case "error":
				return "Error occurred";
			default:
				return "Preparing...";
		}
	};

	const triggerTranscriptDownload = useCallback(
		(text: string, downloadFilename: string) => {
			const element = document.createElement("a");
			const file = new Blob([text], { type: "text/plain" });
			const objectUrl = URL.createObjectURL(file);

			try {
				element.href = objectUrl;
				element.download = downloadFilename;
				document.body.appendChild(element);
				element.click();
				document.body.removeChild(element);
			} finally {
				URL.revokeObjectURL(objectUrl);
			}
		},
		[],
	);

	const downloadTranscript = useCallback(
		async (transcriptionId: string, filename: string) => {
			try {
				const response = await fetch(
					`/api/transcriptions/${transcriptionId}/transcript`,
				);
				if (!response.ok) {
					throw new Error("Transcript not available yet");
				}
				const transcriptText = await response.text();
				triggerTranscriptDownload(
					transcriptText,
					`${filename.replace(/\.[^.]+$/, "")}.txt`,
				);
				setHistoryActionError(null);
			} catch {
				setHistoryActionError(
					"Could not download transcript right now. Please try again.",
				);
			}
		},
		[triggerTranscriptDownload],
	);

	return (
		<div className="w-full max-w-5xl mx-auto space-y-8">
			{/* Upload Area */}
			<Card
				className={`border-2 border-dashed transition-all duration-300 relative overflow-hidden rounded-2xl ${
					isDragOver
						? "border-amber-400 bg-amber-50/50 scale-[1.02] shadow-lg"
						: "border-stone-300 hover:border-amber-400 hover:bg-amber-50/20 hover:shadow-md"
				}`}
				onDragOver={handleDragOver}
				onDragLeave={handleDragLeave}
				onDrop={handleDrop}
			>
				<CardContent className="relative flex flex-col items-center justify-center py-16 px-8 text-center">
					<div
						className={`rounded-2xl p-6 mb-6 transition-all duration-300 ${
							isDragOver
								? "bg-amber-500 text-stone-950 shadow-xl scale-110"
								: "bg-stone-100 hover:bg-amber-50"
						}`}
					>
						<Upload
							className={`h-10 w-10 transition-colors ${!isDragOver ? "text-stone-500" : ""}`}
						/>
					</div>

					<h3 className="text-2xl font-semibold mb-3 text-stone-900">
						{isDragOver
							? "Drop your audio file here"
							: "Upload Audio File"}
					</h3>

					<p className="text-stone-500 mb-8 max-w-lg leading-relaxed text-lg">
						Drag and drop your audio file here, or click to browse
						and select a file from your device. Supported formats:
						{" "}
						{SUPPORTED_AUDIO_FORMATS_TEXT}.
					</p>

					<Button
						onClick={() => fileInputRef.current?.click()}
						size="lg"
						className="mb-8 h-12 px-8 bg-amber-500 hover:bg-amber-600 text-stone-950 font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
					>
						<Upload className="mr-3 h-5 w-5" />
						Choose File
					</Button>

					<div className="flex flex-wrap justify-center gap-3 text-sm">
						<Badge
							variant="outline"
							className="bg-white border-stone-200 text-stone-600 px-4 py-2"
						>
							<FileAudio className="w-3 h-3 mr-2" />
							9 formats supported
						</Badge>
						<Badge
							variant="outline"
							className="bg-white border-stone-200 text-stone-600 px-4 py-2"
						>
							<CheckCircle className="w-3 h-3 mr-2" />
							Max {formatFileSize(maxUploadSizeBytes)} per file
						</Badge>
					</div>

					<input
						ref={fileInputRef}
						type="file"
						multiple
						accept={AUDIO_LIMITS.VALID_EXTENSIONS.join(",")}
						onChange={handleFileSelect}
						className="sr-only"
					/>
				</CardContent>
			</Card>

			{/* Upload Settings Dialog */}
			<Dialog open={dialogOpen} onOpenChange={(open) => {
				setDialogOpen(open);
				if (!open) setPendingFiles([]);
			}}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>
							Start Transcription
							{pendingFiles.length > 1 && (
								<span className="text-sm font-normal text-stone-500 ml-2">
									(1 of {pendingFiles.length})
								</span>
							)}
						</DialogTitle>
						<DialogDescription>
							Configure settings for your transcription.
						</DialogDescription>
					</DialogHeader>

					{pendingFile && (
						<div className="space-y-4">
							<div className="flex items-center gap-3 p-3 bg-stone-50 rounded-lg border border-stone-200">
								<FileAudio className="h-5 w-5 text-amber-500 shrink-0" />
								<div className="min-w-0 flex-1">
									<p className="font-medium text-stone-900 truncate">
										{pendingFile.name}
									</p>
									<p className="text-sm text-stone-500">
										{formatFileSize(pendingFile.size)}
									</p>
								</div>
							</div>

							<label className="flex items-center gap-3 p-3 rounded-lg border border-stone-200 cursor-pointer select-none hover:bg-stone-50 transition-colors">
								<input
									type="checkbox"
									checked={enableDiarization}
									onChange={(e) => setEnableDiarization(e.target.checked)}
									disabled={pendingFile.size > AUDIO_LIMITS.MAX_FILE_SIZE}
									aria-describedby={pendingFile.size > AUDIO_LIMITS.MAX_FILE_SIZE ? "diarization-hint" : undefined}
									className="h-4 w-4 rounded border-stone-300 text-amber-500 focus:ring-amber-500"
								/>
								<Users className="w-4 h-4 text-stone-600" />
								<div>
									<p className="text-sm font-medium text-stone-900">
										Identify Speakers
									</p>
									{pendingFile.size > AUDIO_LIMITS.MAX_FILE_SIZE && (
										<p id="diarization-hint" className="text-xs text-stone-500">
											Not available for files over 100MB
										</p>
									)}
								</div>
							</label>
						</div>
					)}

					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => {
								setDialogOpen(false);
								setPendingFiles([]);
							}}
						>
							Cancel
						</Button>
						<Button
							onClick={startTranscription}
							disabled={!pendingFile}
							className="bg-amber-500 hover:bg-amber-600 text-stone-950 font-semibold"
						>
							<Play className="w-4 h-4 mr-2" />
							{pendingFiles.length > 1 ? "Start & Next" : "Start"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Uploaded Files */}
			{uploadedFiles.length > 0 && (
				<div className="space-y-6">
					<div className="flex items-center justify-between">
						<h3 className="text-2xl font-semibold text-stone-900">
							Processing Files
						</h3>
						<Badge
							variant="outline"
							className="bg-amber-50 text-amber-700 border-amber-200"
						>
							{uploadedFiles.length} file
							{uploadedFiles.length > 1 ? "s" : ""}
						</Badge>
					</div>

					{uploadedFiles.map((uploadedFile) => (
						<Card
							key={uploadedFile.id}
							className="overflow-hidden shadow-sm border border-stone-200 hover:shadow-md transition-all duration-300 rounded-2xl"
						>
							<CardContent className="p-6">
								<div className="flex items-start justify-between mb-4">
									<div className="flex items-center space-x-4 flex-1 min-w-0">
										<div className="flex-shrink-0">
											{getStatusIcon(uploadedFile.status)}
										</div>
										<div className="flex-1 min-w-0">
											<p className="font-semibold text-lg text-stone-900 truncate">
												{uploadedFile.file.name}
											</p>
											<div className="flex items-center space-x-4 text-sm text-stone-500 mt-1">
												<span className="flex items-center">
													<FileAudio className="w-3 h-3 mr-1" />
													{formatFileSize(
														uploadedFile.file.size,
													)}
												</span>
											</div>
										</div>
									</div>

									<Button
										variant="ghost"
										size="sm"
										onClick={() =>
											removeFile(uploadedFile.id)
										}
										className="opacity-60 hover:opacity-100 hover:bg-red-50 hover:text-red-600 transition-all"
									>
										<X className="h-4 w-4" />
									</Button>
									</div>

									{uploadedFile.audioUrl && (
										<div className="mb-4">
											<AudioPlayer src={uploadedFile.audioUrl} />
										</div>
									)}

									{/* Progress Bar */}
									{uploadedFile.status !== "completed" &&
										uploadedFile.status !== "error" && (
										<div className="space-y-3 mb-4">
											<div className="w-full bg-stone-200 rounded-full h-2 overflow-hidden">
												<div
													className="bg-gradient-to-r from-amber-500 to-amber-400 h-2 rounded-full transition-all duration-500"
													style={{
														width: `${uploadedFile.progress || 5}%`,
													}}
												/>
											</div>
											<div className="flex items-center space-x-2">
												<Loader2 className="h-4 w-4 animate-spin text-amber-600" />
												<p className="text-sm font-medium text-amber-700">
													{getStatusText(
														uploadedFile.status,
													)}
												</p>
												<span className="text-sm text-stone-500">
													{uploadedFile.progress || 0}%
												</span>
											</div>
										</div>
									)}

								{/* Error Display */}
								{uploadedFile.status === "error" &&
									uploadedFile.error && (
										<div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
											<div className="flex items-center justify-between mb-2">
												<div className="flex items-center">
													<AlertCircle className="h-5 w-5 text-red-500 mr-2" />
													<p className="font-semibold text-red-700">
														{isDailyLimitErrorMessage(
															uploadedFile.error,
														)
															? DAILY_LIMIT_MESSAGE
															: "Processing Error"}
													</p>
												</div>
												{!isDailyLimitErrorMessage(
													uploadedFile.error,
												) && (
													<Button
														variant="outline"
														size="sm"
														className="bg-white hover:bg-red-50 border-red-300 text-red-700 hover:text-red-800"
														onClick={() =>
															retryFile(
																uploadedFile.id,
															)
														}
													>
														<RotateCcw className="w-4 h-4 mr-2" />
														Retry
													</Button>
												)}
											</div>
											<p className="text-sm text-red-600 leading-relaxed">
												{uploadedFile.error}
											</p>
										</div>
									)}

								{/* Transcription Preview */}
								{uploadedFile.transcription && (
									<div className="mt-4 p-5 bg-emerald-50 border border-emerald-200 rounded-xl">
										<div className="flex items-center justify-between mb-3">
											<div className="flex items-center">
												<CheckCircle className="h-5 w-5 text-emerald-600 mr-2" />
												<p className="font-semibold text-emerald-800">
													Transcription Complete
												</p>
											</div>
											<Button
												variant="outline"
												size="sm"
												className="bg-white hover:bg-emerald-50 border-emerald-300 text-emerald-700 hover:text-emerald-800"
												onClick={() => {
													triggerTranscriptDownload(
														uploadedFile.transcription as string,
														`${uploadedFile.file.name}_transcription.txt`,
													);
												}}
											>
												<Download className="w-4 h-4 mr-2" />
												Download Full Text
											</Button>
										</div>
										<div className="bg-white/70 p-4 rounded-lg border border-emerald-200">
											<p className="text-sm text-stone-700 leading-relaxed max-h-32 overflow-y-auto">
												{uploadedFile.transcription}
											</p>
										</div>
									</div>
								)}
							</CardContent>
						</Card>
					))}

					{hasDailyLimitError && (
						<Card className="overflow-hidden border-amber-200 bg-amber-50/70">
							<CardContent className="p-6">
								<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
									<div className="space-y-1">
										<p className="font-semibold text-amber-900">
											Free daily limit reached
										</p>
										<p className="text-sm text-amber-800">
											Upgrade your account to Pro for
											higher limits and uninterrupted
											transcriptions.
										</p>
									</div>
									<div className="flex gap-3">
										<Button asChild>
											<Link
												href={
													isSignedIn
														? "/subscription"
														: "/pricing"
												}
											>
												Upgrade to Pro
											</Link>
										</Button>
										<Button variant="outline" asChild>
											<Link href="/pricing">
												View Plans
											</Link>
										</Button>
									</div>
								</div>
							</CardContent>
						</Card>
					)}
				</div>
			)}

			{shouldShowPreviousTranscriptions && (
				<div className="space-y-4">
					<div className="flex items-center justify-between">
						<h3 className="text-xl font-semibold text-stone-900">
							{isSignedIn
								? "Recent Transcriptions"
								: "Previous Transcriptions"}
						</h3>
							<Button
								variant="outline"
								size="sm"
								onClick={() => {
									setHistoryActionError(null);
									void refetchPreviousTranscriptions();
								}}
								disabled={fetchingPreviousTranscriptions}
							>
								{fetchingPreviousTranscriptions
									? "Refreshing..."
									: "Refresh"}
							</Button>
					</div>

					{previousTranscriptionsError && (
						<p className="text-sm text-red-600">
							{previousTranscriptionsError}
						</p>
					)}

					{previousTranscriptions.map((item) => (
						<Card
							key={item.id}
							className="overflow-hidden border border-stone-200 bg-white"
						>
							<CardContent className="p-4">
								<div className="flex items-center justify-between gap-4">
									<div className="min-w-0">
										<p className="font-medium text-stone-900 truncate">
											{item.filename}
										</p>
										<p className="text-xs text-stone-500">
											{new Date(
												item.createdAt,
											).toLocaleString()}
										</p>
									</div>
									<div className="flex items-center gap-2">
										<Badge variant="outline">
											{item.status}
											{item.status === "processing" ||
											item.status === "pending"
												? ` (${item.progress}%)`
												: ""}
										</Badge>
										{item.status === "completed" && (
											<Button
												size="sm"
												variant="outline"
												onClick={() =>
													void downloadTranscript(
														item.id,
														item.filename,
													)
												}
											>
												<Download className="h-4 w-4 mr-1" />
												Download
											</Button>
										)}
										<Button
											size="sm"
											variant="outline"
											onClick={() =>
												void handleDeletePreviousTranscription(
													item.id,
												)
											}
											disabled={deletingPreviousIds.has(
												item.id,
											)}
											className="text-red-600 hover:text-red-700 hover:bg-red-50"
										>
											{deletingPreviousIds.has(item.id) ? (
												<Loader2 className="h-4 w-4 animate-spin" />
											) : (
												<Trash2 className="h-4 w-4" />
											)}
										</Button>
									</div>
								</div>
									{item.preview && (
										<p className="mt-2 text-sm text-stone-600 line-clamp-2">
											{item.preview}
										</p>
									)}
									{item.audioKey && (
										<div className="mt-3">
											<AudioPlayer src={item.audioKey} />
										</div>
									)}
								</CardContent>
							</Card>
						))}
				</div>
			)}
		</div>
	);
}
