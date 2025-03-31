import type { ContentItem } from './index';

// Base interface for all route data
export interface BaseRouteData {
	configError?: string;
	error?: string;
	isDev?: boolean;
	publishedContentTypes?: string[];
	routes?: { path: string; label: string }[];
}

// [contentType] route
export interface ContentTypeRouteData extends BaseRouteData {
	items: ContentItem[];
	contentType: string;
}

// [contentType]/[slug] route
export interface ContentItemRouteData extends BaseRouteData {
	item: ContentItem & {
		processedContent?: string;
		content?: string;
	};
	contentType: string;
}

// tag/[tag] route
export interface TagRouteData extends BaseRouteData {
	items: ContentItem[];
	contentType: string;
	tag: string;
}
