export interface ContentItem {
	title: string;
	slug: string;
	date: string;
	type: string;
	content: string;
	excerpt?: string;
	metadata?: {
		updated?: string;
		published?: boolean;
		category?: string;
		tags?: string | string[];
	};
}

export interface ContentData {
	items: ContentItem[];
	contentType: string;
	lastUpdated: string;
	error?: string;
	configError?: string;
	isDev?: boolean;
}
