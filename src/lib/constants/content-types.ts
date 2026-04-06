export const CONTENT_TYPES = {
	MEETING: "meeting",
	LECTURE: "lecture",
	VOICE_MEMO: "voice-memo",
	CONVERSATION: "conversation",
} as const;

export type ContentType = (typeof CONTENT_TYPES)[keyof typeof CONTENT_TYPES];

export const ALL_CONTENT_TYPES: ContentType[] = [
	CONTENT_TYPES.MEETING,
	CONTENT_TYPES.LECTURE,
	CONTENT_TYPES.VOICE_MEMO,
	CONTENT_TYPES.CONVERSATION,
];

export interface SectionConfig {
	key: string;
	label: string;
	type: "list" | "rich";
}

export interface ContentTypeTemplate {
	label: string;
	description: string;
	sections: SectionConfig[];
}

export const CONTENT_TYPE_TEMPLATES: Record<ContentType, ContentTypeTemplate> = {
	[CONTENT_TYPES.MEETING]: {
		label: "Meeting",
		description: "Team meetings, standups, 1:1s, or any group discussion with action items",
		sections: [
			{ key: "keyPoints", label: "Key Points", type: "list" },
			{ key: "actionItems", label: "Action Items", type: "rich" },
			{ key: "decisions", label: "Decisions", type: "list" },
			{ key: "keyTakeaways", label: "Key Takeaways", type: "list" },
		],
	},
	[CONTENT_TYPES.LECTURE]: {
		label: "Lecture",
		description: "Classes, presentations, talks, or educational content",
		sections: [
			{ key: "keyTopics", label: "Key Topics", type: "list" },
			{ key: "definitions", label: "Definitions", type: "list" },
			{ key: "importantConcepts", label: "Important Concepts", type: "list" },
			{ key: "studyQuestions", label: "Study Questions", type: "list" },
		],
	},
	[CONTENT_TYPES.VOICE_MEMO]: {
		label: "Voice Memo",
		description: "Personal notes, reminders, or quick thoughts",
		sections: [
			{ key: "mainIdeas", label: "Main Ideas", type: "list" },
			{ key: "todoItems", label: "To-Do Items", type: "rich" },
			{ key: "reminders", label: "Reminders", type: "list" },
		],
	},
	[CONTENT_TYPES.CONVERSATION]: {
		label: "Conversation",
		description: "General discussions, phone calls, or casual conversations",
		sections: [
			{ key: "mainTopics", label: "Main Topics", type: "list" },
			{ key: "keyPoints", label: "Key Points", type: "list" },
			{ key: "agreements", label: "Agreements", type: "list" },
			{ key: "openQuestions", label: "Open Questions", type: "list" },
		],
	},
};
