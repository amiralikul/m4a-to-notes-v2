import type {
	FlexibleSummaryData,
	LegacySummaryData,
	SummaryRichItem,
	SummarySection,
	TranscriptionSummaryData,
} from "@/db/schema";
import { isFlexibleSummary } from "@/db/schema";
import { CONTENT_TYPE_TEMPLATES } from "@/lib/constants/content-types";
import { Badge } from "@/components/ui/badge";

interface SummaryRendererProps {
	data: TranscriptionSummaryData;
	idPrefix?: string;
	className?: string;
}

function isRichItems(items: string[] | SummaryRichItem[]): items is SummaryRichItem[] {
	return items.length > 0 && typeof items[0] === "object" && "text" in items[0];
}

function RichItemList({ items, idPrefix }: { items: SummaryRichItem[]; idPrefix: string }) {
	return (
		<ul className="list-disc pl-5 mt-1 text-stone-600 space-y-1">
			{items.map((item, index) => (
				<li key={`${idPrefix}-${index}`}>
					{item.text}
					{item.owner && ` (Owner: ${item.owner})`}
					{item.dueDate && ` (Due: ${item.dueDate})`}
				</li>
			))}
		</ul>
	);
}

function StringItemList({ items, idPrefix }: { items: string[]; idPrefix: string }) {
	return (
		<ul className="list-disc pl-5 mt-1 text-stone-600 space-y-1">
			{items.map((item, index) => (
				<li key={`${idPrefix}-${index}`}>{item}</li>
			))}
		</ul>
	);
}

function SectionRenderer({
	section,
	idPrefix,
}: {
	section: SummarySection;
	idPrefix: string;
}) {
	const sectionPrefix = `${idPrefix}-${section.key}`;

	return (
		<div>
			<p className="font-semibold text-stone-900 text-sm">{section.label}</p>
			{section.items.length === 0 ? (
				<p className="text-stone-500 text-sm mt-1">None found.</p>
			) : isRichItems(section.items) ? (
				<RichItemList items={section.items} idPrefix={sectionPrefix} />
			) : (
				<StringItemList items={section.items} idPrefix={sectionPrefix} />
			)}
		</div>
	);
}

function FlexibleSummaryRenderer({
	data,
	idPrefix,
}: {
	data: FlexibleSummaryData;
	idPrefix: string;
}) {
	return (
		<div className="space-y-4">
			<div>
				<p className="font-semibold text-stone-900 text-sm">Overview</p>
				<p className="text-stone-600 text-sm mt-1">{data.summary}</p>
			</div>
			{data.sections.map((section) => (
				<SectionRenderer
					key={section.key}
					section={section}
					idPrefix={idPrefix}
				/>
			))}
		</div>
	);
}

function LegacySummaryRenderer({
	data,
	idPrefix,
}: {
	data: LegacySummaryData;
	idPrefix: string;
}) {
	return (
		<div className="space-y-4">
			<div>
				<p className="font-semibold text-stone-900 text-sm">Overview</p>
				<p className="text-stone-600 text-sm mt-1">{data.summary}</p>
			</div>

			<div>
				<p className="font-semibold text-stone-900 text-sm">Key Points</p>
				<StringItemList items={data.keyPoints} idPrefix={`${idPrefix}-points`} />
			</div>

			<div>
				<p className="font-semibold text-stone-900 text-sm">Action Items</p>
				{data.actionItems.length === 0 ? (
					<p className="text-stone-500 text-sm mt-1">No action items found.</p>
				) : (
					<ul className="list-disc pl-5 mt-1 text-stone-600 space-y-1">
						{data.actionItems.map((item, index) => (
							<li key={`${idPrefix}-action-${index}`}>
								{item.task}
								{item.owner && ` (Owner: ${item.owner})`}
								{item.dueDate && ` (Due: ${item.dueDate})`}
							</li>
						))}
					</ul>
				)}
			</div>

			<div>
				<p className="font-semibold text-stone-900 text-sm">Key Takeaways</p>
				<StringItemList items={data.keyTakeaways} idPrefix={`${idPrefix}-takeaways`} />
			</div>
		</div>
	);
}

export function ContentTypeBadge({ contentType }: { contentType: string }) {
	const template = CONTENT_TYPE_TEMPLATES[contentType as keyof typeof CONTENT_TYPE_TEMPLATES];
	const label = template?.label ?? contentType;

	return (
		<Badge variant="outline" className="bg-violet-50 text-violet-700 border-violet-200">
			{label}
		</Badge>
	);
}

export function SummaryRenderer({
	data,
	idPrefix = "summary",
	className,
}: SummaryRendererProps) {
	if (isFlexibleSummary(data)) {
		return (
			<div className={className}>
				<FlexibleSummaryRenderer data={data} idPrefix={idPrefix} />
			</div>
		);
	}

	return (
		<div className={className}>
			<LegacySummaryRenderer data={data as LegacySummaryData} idPrefix={idPrefix} />
		</div>
	);
}
