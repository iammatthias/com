export interface ContentItem {
	title: string;
	slug: string;
	date: string;
	content: string;
	metadata?: {
		updated?: string;
		published?: boolean;
		category?: string;
		tags?: string | string[];
		path?: string;
		image?: string;
		imageCredit?: string;
	};
}

export interface ContentResponse {
	items: ContentItem[];
	contentType: string;
	configError?: string;
}
