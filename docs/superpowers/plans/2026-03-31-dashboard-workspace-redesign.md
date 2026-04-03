# Dashboard Workspace Redesign Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the split `/dashboard` and `/dashboard/[id]` flow with a single summary-first workspace that keeps upload at the top, transcription history on the left, selected content on the right, and legacy links working through redirects.

**Architecture:** Keep the existing API surface and React Query data flow, but move the monolithic dashboard/detail pages into a thin route layer plus focused dashboard components under `src/components/dashboard/`. Put URL selection and delete-reselection into pure helper functions so the highest-risk navigation behavior is deterministic and unit tested, and keep the right-pane tabs prop-driven enough to verify summary/transcript/chat rendering with the current node-based Vitest setup.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, TanStack Query, shadcn/ui (`Card`, `Tabs`, `ScrollArea`, `Separator`, `Skeleton`, `Badge`, `Button`), Vitest, `react-dom/server`

---

## File Map

### Route entry points

- Modify: `src/app/dashboard/page.tsx`
  - Replace the current 525-line page with a thin route entry that renders the new dashboard workspace component.
- Modify: `src/app/dashboard/[id]/page.tsx`
  - Replace the current detail UI with a redirect shim to `/dashboard?item=<id>`.
- Create: `src/app/dashboard/__tests__/dashboard-item-page.test.ts`
  - Verify legacy `/dashboard/[id]` requests redirect to the canonical query-param route.

### Dashboard workspace modules

- Create: `src/components/dashboard/types.ts`
  - Shared list/detail/summary/translation types extracted from the current page-local interfaces.
- Create: `src/components/dashboard/status-config.ts`
  - Shared badge/status label config reused by the sidebar and selected-item pane.
- Create: `src/components/dashboard/selection.ts`
  - Pure helpers for resolving the selected transcription from `?item=`, deciding when to replace the URL, and computing optimistic delete/rollback state.
- Create: `src/components/dashboard/dashboard-workspace.tsx`
  - Client shell that owns list/detail queries, router synchronization, active tab state, and delete behavior.
- Create: `src/components/dashboard/transcription-sidebar.tsx`
  - Scrollable left rail that renders compact selectable history items.
- Create: `src/components/dashboard/transcription-workspace-pane.tsx`
  - Main right pane with header, tabs, audio player, local error states, and tab panel switching.
- Create: `src/components/dashboard/transcription-summary-panel.tsx`
  - Summary panel content, including summary status messaging and composition of translation controls when available.
- Create: `src/components/dashboard/transcription-translations-panel.tsx`
  - Translation request/view/delete/retry UI extracted from the old detail page and kept local to the summary workspace.
- Create: `src/components/dashboard/transcription-transcript-panel.tsx`
  - Transcript/diarization rendering extracted from the old detail page.
- Create: `src/components/dashboard/transcription-chat-placeholder.tsx`
  - Non-functional but intentional placeholder tab content.
- Create: `src/components/dashboard/dashboard-empty-state.tsx`
  - Empty/placeholder surface for no transcriptions and no current selection.

### Tests

- Create: `src/components/dashboard/__tests__/selection.test.ts`
  - Unit tests for default selection, invalid `item` fallback, and delete-reselection.
- Create: `src/components/dashboard/__tests__/transcription-sidebar.test.tsx`
  - Static-render tests for the compact left-rail item states.
- Create: `src/components/dashboard/__tests__/transcription-workspace-pane.test.tsx`
  - Static-render tests for summary, transcript, and chat placeholder states without adding a DOM test stack.

### Existing reusable modules to keep as-is unless implementation pressure proves otherwise

- Reuse: `src/components/file-upload.tsx`
  - Keep upload logic intact and render it as the top dashboard rail via workspace layout composition instead of rewriting upload behavior.
- Reuse: `src/components/audio-player.tsx`
- Reuse: `src/components/summary-renderer.tsx`
- Reuse: `src/lib/query-keys.ts`
- Reuse: `src/app/api/me/transcriptions/route.ts`
- Reuse: `src/app/api/transcriptions/[transcriptionId]/detail/route.ts`
- Reuse: `src/app/api/transcriptions/[transcriptionId]/summary/route.ts`
- Reuse: `src/app/api/transcriptions/[transcriptionId]/translations/route.ts`
- Reuse: `src/app/api/transcriptions/[transcriptionId]/translations/[language]/route.ts`

### Scope guard

- Do **not** pull the unimplemented rename/display-name spec into this work.
- Render `filename` as the dashboard title for now.
- If a small title helper is useful for future-proofing, keep it internal and still return `filename` today.

## Task 1: Lock Selection Rules Into Pure Helpers

**Files:**
- Create: `src/components/dashboard/selection.ts`
- Create: `src/components/dashboard/__tests__/selection.test.ts`
- Create: `src/components/dashboard/types.ts`

- [ ] **Step 1: Write the failing selection tests**

```ts
import { describe, expect, it } from "vitest";
import {
	getNextSelectedIdAfterDelete,
	resolveDashboardSelection,
} from "@/components/dashboard/selection";

const items = [
	{ id: "newest", filename: "b.m4a", createdAt: "2026-03-31T10:00:00.000Z" },
	{ id: "older", filename: "a.m4a", createdAt: "2026-03-30T10:00:00.000Z" },
];

describe("resolveDashboardSelection", () => {
	it("keeps a valid deep-link selection without normalizing the URL", () => {
		expect(
			resolveDashboardSelection({ requestedId: "older", items }),
		).toMatchObject({
			selectedId: "older",
			normalizedId: "older",
			shouldReplaceUrl: false,
		});
	});

	it("defaults to the first item when no item query param is present", () => {
		expect(
			resolveDashboardSelection({ requestedId: null, items }),
		).toMatchObject({
			selectedId: "newest",
			normalizedId: "newest",
			shouldReplaceUrl: true,
		});
	});

	it("falls back to the first item and replaces the URL when item is invalid", () => {
		expect(
			resolveDashboardSelection({ requestedId: "missing", items }),
		).toMatchObject({
			selectedId: "newest",
			normalizedId: "newest",
			shouldReplaceUrl: true,
		});
	});
});

describe("getNextSelectedIdAfterDelete", () => {
	it("selects the next remaining item after deleting the active selection", () => {
		expect(
			getNextSelectedIdAfterDelete({
				deletedId: "newest",
				selectedId: "newest",
				remainingItems: [{ id: "older", filename: "a.m4a", createdAt: "2026-03-30T10:00:00.000Z" }],
			}),
		).toBe("older");
	});

	it("returns null after deleting the final remaining transcription", () => {
		expect(
			getNextSelectedIdAfterDelete({
				deletedId: "newest",
				selectedId: "newest",
				remainingItems: [],
			}),
		).toBeNull();
	});
});

describe("createOptimisticDeleteTransition", () => {
	it("keeps rollback data so list state and URL selection can be restored together", () => {
		expect(
			createOptimisticDeleteTransition({
				items,
				selectedId: "newest",
				deletedId: "newest",
			}),
		).toMatchObject({
			next: {
				selectedId: "older",
				normalizedId: "older",
			},
			rollback: {
				selectedId: "newest",
				normalizedId: "newest",
			},
		});
	});
});
```

- [ ] **Step 2: Run the selection test to verify it fails**

Run: `npx vitest run src/components/dashboard/__tests__/selection.test.ts`
Expected: FAIL because `selection.ts` and shared dashboard types do not exist yet.

- [ ] **Step 3: Add shared dashboard types and implement the selection helper**

```ts
export function resolveDashboardSelection({
	requestedId,
	items,
}: {
	requestedId: string | null;
	items: DashboardListItem[];
}) {
	if (items.length === 0) {
		return {
			selectedId: null,
			normalizedId: null,
			shouldReplaceUrl: requestedId !== null,
		};
	}

	const selected = requestedId
		? items.find((item) => item.id === requestedId) ?? items[0]
		: items[0];

	return {
		selectedId: selected.id,
		normalizedId: selected.id,
		shouldReplaceUrl: requestedId !== selected.id,
	};
}

export function createOptimisticDeleteTransition({
	items,
	selectedId,
	deletedId,
}: {
	items: DashboardListItem[];
	selectedId: string | null;
	deletedId: string;
}) {
	const remainingItems = items.filter((item) => item.id !== deletedId);
	const nextSelectedId = getNextSelectedIdAfterDelete({
		deletedId,
		selectedId,
		remainingItems,
	});

	return {
		next: {
			items: remainingItems,
			selectedId: nextSelectedId,
			normalizedId: nextSelectedId,
		},
		rollback: {
			items,
			selectedId,
			normalizedId: selectedId,
		},
	};
}
```

- [ ] **Step 4: Re-run the selection test**

Run: `npx vitest run src/components/dashboard/__tests__/selection.test.ts`
Expected: PASS

- [ ] **Step 5: Commit the helper groundwork**

```bash
git add src/components/dashboard/types.ts src/components/dashboard/selection.ts src/components/dashboard/__tests__/selection.test.ts
git commit -m "add dashboard selection helpers"
```

## Task 2: Extract the Right-Pane Rendering Surface

**Files:**
- Create: `src/components/dashboard/status-config.ts`
- Create: `src/components/dashboard/transcription-workspace-pane.tsx`
- Create: `src/components/dashboard/transcription-summary-panel.tsx`
- Create: `src/components/dashboard/transcription-translations-panel.tsx`
- Create: `src/components/dashboard/transcription-transcript-panel.tsx`
- Create: `src/components/dashboard/transcription-chat-placeholder.tsx`
- Create: `src/components/dashboard/__tests__/transcription-workspace-pane.test.tsx`

- [ ] **Step 1: Write the failing static-render tests for the right pane**

```tsx
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { TranscriptionWorkspacePane } from "@/components/dashboard/transcription-workspace-pane";

vi.mock("@/components/audio-player", () => ({
	AudioPlayer: ({ src }: { src: string }) => <div data-audio={src}>audio</div>,
}));

describe("TranscriptionWorkspacePane", () => {
	it("renders summary content when the active tab is summary", () => {
		const html = renderToStaticMarkup(
			<TranscriptionWorkspacePane
				activeTab="summary"
				onTabChange={() => {}}
				transcription={completedTranscription}
				summary={completedSummary}
				translations={[]}
			/>,
		);

		expect(html).toContain("Summary");
		expect(html).toContain("Overview");
	});

	it("renders transcript content when the active tab is transcript", () => {
		const html = renderToStaticMarkup(
			<TranscriptionWorkspacePane
				activeTab="transcript"
				onTabChange={() => {}}
				transcription={completedTranscription}
				summary={completedSummary}
				translations={[]}
			/>,
		);

		expect(html).toContain("Speaker 1");
	});

	it("renders the placeholder when the active tab is chat", () => {
		const html = renderToStaticMarkup(
			<TranscriptionWorkspacePane
				activeTab="chat"
				onTabChange={() => {}}
				transcription={completedTranscription}
				summary={completedSummary}
				translations={[]}
			/>,
		);

		expect(html).toContain("Chat is coming soon");
	});

	it("renders translation controls inside the summary workspace", () => {
		const html = renderToStaticMarkup(
			<TranscriptionWorkspacePane
				activeTab="summary"
				onTabChange={() => {}}
				transcription={completedTranscription}
				summary={completedSummary}
				translations={[completedTranslation]}
			/>,
		);

		expect(html).toContain("Translations");
		expect(html).toContain("View");
	});
});
```

- [ ] **Step 2: Run the right-pane test to verify it fails**

Run: `npx vitest run src/components/dashboard/__tests__/transcription-workspace-pane.test.tsx`
Expected: FAIL because the extracted workspace-pane modules do not exist yet.

- [ ] **Step 3: Implement the shared status config and right-pane components**

```tsx
export function TranscriptionWorkspacePane(props: Props) {
	return (
		<Card className="border-stone-200">
			<CardContent className="flex flex-col gap-6 p-6">
				<WorkspaceHeader {...props} />
				<Tabs value={props.activeTab} onValueChange={props.onTabChange}>
					<TabsList className="grid w-full grid-cols-3">
						<TabsTrigger value="summary">Summary</TabsTrigger>
						<TabsTrigger value="transcript">Transcript</TabsTrigger>
						<TabsTrigger value="chat">Chat</TabsTrigger>
					</TabsList>
					<AudioPlayer src={props.audioSrc} />
					<TabsContent value="summary">
						<TranscriptionSummaryPanel {...props} />
					</TabsContent>
					<TabsContent value="transcript">
						<TranscriptionTranscriptPanel transcription={props.transcription} />
					</TabsContent>
					<TabsContent value="chat">
						<TranscriptionChatPlaceholder />
					</TabsContent>
				</Tabs>
			</CardContent>
		</Card>
	);
}
```

`TranscriptionSummaryPanel` should compose a focused `TranscriptionTranslationsPanel` so translation request/view/delete/retry states stay local to the summary tab instead of leaking into the page shell.

- [ ] **Step 4: Re-run the right-pane test**

Run: `npx vitest run src/components/dashboard/__tests__/transcription-workspace-pane.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit the extracted pane**

```bash
git add src/components/dashboard/status-config.ts src/components/dashboard/transcription-workspace-pane.tsx src/components/dashboard/transcription-summary-panel.tsx src/components/dashboard/transcription-translations-panel.tsx src/components/dashboard/transcription-transcript-panel.tsx src/components/dashboard/transcription-chat-placeholder.tsx src/components/dashboard/__tests__/transcription-workspace-pane.test.tsx
git commit -m "extract dashboard workspace pane"
```

## Task 3: Build the Sidebar and Empty States

**Files:**
- Create: `src/components/dashboard/transcription-sidebar.tsx`
- Create: `src/components/dashboard/dashboard-empty-state.tsx`
- Modify: `src/components/dashboard/status-config.ts`
- Create: `src/components/dashboard/__tests__/transcription-sidebar.test.tsx`

- [ ] **Step 1: Write a failing sidebar render test**

```tsx
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { TranscriptionSidebar } from "@/components/dashboard/transcription-sidebar";

it("marks the selected transcription and renders compact metadata", () => {
	const html = renderToStaticMarkup(
		<TranscriptionSidebar
			items={[sampleListItem]}
			selectedId="tr_1"
			onSelect={() => {}}
			isLoading={false}
			error={null}
		/>,
	);

	expect(html).toContain("Meeting.m4a");
	expect(html).toContain("Completed");
});
```

- [ ] **Step 2: Run the sidebar test to verify it fails**

Run: `npx vitest run src/components/dashboard/__tests__/transcription-sidebar.test.tsx`
Expected: FAIL because the sidebar component and test file do not exist yet.

- [ ] **Step 3: Implement the sidebar and empty-state components**

```tsx
export function TranscriptionSidebar(props: Props) {
	if (props.error) {
		return <SidebarErrorState onRetry={props.onRetry} message={props.error.message} />;
	}

	return (
		<Card className="border-stone-200">
			<CardContent className="p-0">
				<ScrollArea className="h-[32rem]">
					<div className="flex flex-col gap-2 p-3">
						{props.items.map((item) => (
							<button
								key={item.id}
								type="button"
								onClick={() => props.onSelect(item.id)}
								className={cn(
									"rounded-2xl border p-3 text-left transition-colors",
									item.id === props.selectedId
										? "border-stone-900 bg-stone-900 text-stone-50"
										: "border-stone-200 bg-background hover:bg-stone-50",
								)}
							>
								...
							</button>
						))}
					</div>
				</ScrollArea>
			</CardContent>
		</Card>
	);
}
```

- [ ] **Step 4: Re-run the sidebar test**

Run: `npx vitest run src/components/dashboard/__tests__/transcription-sidebar.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit the sidebar layer**

```bash
git add src/components/dashboard/transcription-sidebar.tsx src/components/dashboard/dashboard-empty-state.tsx src/components/dashboard/status-config.ts src/components/dashboard/__tests__/transcription-sidebar.test.tsx
git commit -m "add dashboard sidebar components"
```

## Task 4: Replace `/dashboard` With the Unified Workspace Controller

**Files:**
- Modify: `src/app/dashboard/page.tsx`
- Create: `src/components/dashboard/dashboard-workspace.tsx`
- Modify: `src/components/dashboard/types.ts`
- Modify: `src/components/dashboard/selection.ts`

- [ ] **Step 1: Rewrite the route entry as a thin wrapper**

```tsx
import { DashboardWorkspace } from "@/components/dashboard/dashboard-workspace";

export default function DashboardPage() {
	return <DashboardWorkspace />;
}
```

- [ ] **Step 2: Implement the client workspace controller**

```tsx
"use client";

export function DashboardWorkspace() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const requestedId = searchParams.get("item");
	const [activeTab, setActiveTab] = useState<WorkspaceTab>("summary");

	const listQuery = useQuery({ queryKey: transcriptionKeys.list(), queryFn: fetchTranscriptionsApi, ... });
	const items = listQuery.data?.transcriptions ?? [];

const selection = resolveDashboardSelection({ requestedId, items });
const selectedId = selection.selectedId;

	useEffect(() => {
		if (!selection.shouldReplaceUrl) return;
		router.replace(selection.normalizedId ? `/dashboard?item=${selection.normalizedId}` : "/dashboard");
	}, [router, selection]);

	const detailQuery = useQuery({
		queryKey: selectedId ? transcriptionKeys.detail(selectedId) : ["transcriptions", "none"],
		queryFn: () => fetchTranscription(selectedId!),
		enabled: !!selectedId,
	});

	const deleteMutation = useMutation({
		mutationFn: deleteTranscriptionApi,
		onMutate: async (deletedId) => {
			const transition = createOptimisticDeleteTransition({
				items,
				selectedId,
				deletedId,
			});

			queryClient.setQueryData(transcriptionKeys.list(), (previous) => ({
				...previous,
				transcriptions: transition.next.items,
				total: transition.next.items.length,
			}));

			router.replace(
				transition.next.selectedId
					? `/dashboard?item=${transition.next.selectedId}`
					: "/dashboard",
			);

			return transition;
		},
		onError: (_error, _deletedId, transition) => {
			if (!transition) return;
			queryClient.setQueryData(transcriptionKeys.list(), (previous) => ({
				...previous,
				transcriptions: transition.rollback.items,
				total: transition.rollback.items.length,
			}));
			router.replace(
				transition.rollback.selectedId
					? `/dashboard?item=${transition.rollback.selectedId}`
					: "/dashboard",
			);
		},
	});

	return (
		<div className="container mx-auto flex flex-col gap-6 py-8">
			<FileUpload showHistory={false} />
			<div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
				<TranscriptionSidebar ... />
				{selectedId ? <TranscriptionWorkspacePane ... /> : <DashboardEmptyState />}
			</div>
		</div>
	);
}
```

- [ ] **Step 3: Reset the active tab whenever the selected transcription changes**

Run: update `dashboard-workspace.tsx` so every new selection calls `setActiveTab("summary")` from a `useEffect` keyed on `selectedId`.
Expected: the workspace always opens new selections on `Summary`.

- [ ] **Step 4: Verify the helper and pane tests still pass after integration**

Run: `npx vitest run src/components/dashboard/__tests__/selection.test.ts src/components/dashboard/__tests__/transcription-sidebar.test.tsx src/components/dashboard/__tests__/transcription-workspace-pane.test.tsx`
Expected: PASS

- [ ] **Step 5: Run type-check on the workspace integration**

Run: `npm run type-check`
Expected: PASS

- [ ] **Step 6: Commit the unified workspace page**

```bash
git add src/app/dashboard/page.tsx src/components/dashboard/dashboard-workspace.tsx src/components/dashboard/types.ts src/components/dashboard/selection.ts
git commit -m "build unified dashboard workspace"
```

## Task 5: Replace the Old Detail Page With a Redirect Shim

**Files:**
- Modify: `src/app/dashboard/[id]/page.tsx`
- Create: `src/app/dashboard/__tests__/dashboard-item-page.test.ts`

- [ ] **Step 1: Write the failing redirect test**

```ts
import { describe, expect, it, vi } from "vitest";

const redirect = vi.fn();

vi.mock("next/navigation", () => ({
	redirect: (url: string) => redirect(url),
}));

it("redirects /dashboard/[id] to the canonical workspace URL", async () => {
	const Page = (await import("@/app/dashboard/[id]/page")).default;

	await Page({ params: Promise.resolve({ id: "tr_1" }) } as never);

	expect(redirect).toHaveBeenCalledWith("/dashboard?item=tr_1");
});
```

- [ ] **Step 2: Run the redirect test to verify it fails**

Run: `npx vitest run src/app/dashboard/__tests__/dashboard-item-page.test.ts`
Expected: FAIL because the page still exports the legacy client detail UI.

- [ ] **Step 3: Replace the file with a server redirect**

```tsx
import { redirect } from "next/navigation";

export default async function DashboardItemPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	redirect(`/dashboard?item=${id}`);
}
```

- [ ] **Step 4: Re-run the redirect test**

Run: `npx vitest run src/app/dashboard/__tests__/dashboard-item-page.test.ts`
Expected: PASS

- [ ] **Step 5: Commit the redirect shim**

```bash
git add src/app/dashboard/[id]/page.tsx src/app/dashboard/__tests__/dashboard-item-page.test.ts
git commit -m "redirect dashboard detail route"
```

## Task 6: Final Verification and Cleanup

**Files:**
- Modify: any files needed to fix failures surfaced by verification

- [ ] **Step 1: Run the targeted dashboard-related test suite**

Run: `npx vitest run src/components/dashboard/__tests__/selection.test.ts src/components/dashboard/__tests__/transcription-sidebar.test.tsx src/components/dashboard/__tests__/transcription-workspace-pane.test.tsx src/app/dashboard/__tests__/dashboard-item-page.test.ts`
Expected: PASS

- [ ] **Step 2: Run the existing route regression tests that the redesign touches indirectly**

Run: `npx vitest run src/app/api/__tests__/me-transcriptions-route.test.ts src/app/api/__tests__/me-transcription-delete-route.test.ts`
Expected: PASS

- [ ] **Step 3: Run the repository verification commands**

Run: `npm run type-check`
Expected: PASS

Run: `npm run lint`
Expected: PASS

Run: `npm run test`
Expected: PASS

- [ ] **Step 4: Do a manual dashboard smoke-check in the browser**

Run: `npm run dev`
Expected:
- `/dashboard` selects the newest transcription when `?item=` is absent
- a valid `/dashboard?item=<id>` deep link keeps that exact selection
- invalid `?item=` normalizes with `router.replace`
- selecting a sidebar item updates the right pane without leaving the page
- deleting the active item moves selection to the next available item or the empty state
- if optimistic delete fails, the previous list and URL selection are restored together
- `/dashboard/<id>` redirects to `/dashboard?item=<id>`

- [ ] **Step 5: Commit any final polish required by verification**

```bash
git add src/app/dashboard src/components/dashboard
git commit -m "polish dashboard workspace redesign"
```
