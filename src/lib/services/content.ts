// import { env } from '$env/dynamic/private';
import matter from 'gray-matter';
import { env } from '$env/dynamic/private';
import { loadContent } from '$lib/utils/github';
import {
	getContentForType,
	getContentBySlug as storeGetContentBySlug,
	getAllContent,
	type ContentItem
} from '$lib/store/content-store';
import type { ContentItem as ContentItemType } from '$lib/types';

// Mark this module as server-only
export const server = true;

// Type for GitHub content items
export interface ContentItem {
	slug: string;
	title: string;
	date: string;
	content: string;
	excerpt: string;
	type: string;
	metadata: Record<string, any>;
}

// Define a type for the fetch function
type FetchFn = typeof fetch;

// Cache content to avoid excessive API calls
const contentCache = new Map<string, ContentItem[]>();
const contentTypeCache = new Map<string, string[]>();

// Cache for content availability status
const contentAvailabilityCache = new Map<string, boolean>();

// Helper to check if GitHub configuration is valid
function isGitHubConfigValid(): boolean {
	return (
		!!env.GITHUB_TOKEN &&
		!!env.GITHUB_REPO_OWNER &&
		!!env.GITHUB_REPO_NAME &&
		!!env.GITHUB_CONTENT_PATH
	);
}

// Get content by type
export async function getContentByType(type: string, fetchFn: FetchFn): Promise<ContentItem[]> {
	// Check cache first
	if (contentCache.has(type)) {
		return contentCache.get(type) || [];
	}

	try {
		console.log(`[getContentByType] Fetching content for type ${type}`);
		const content = getContentForType(type);

		// Update cache
		contentCache.set(type, content);
		return content;
	} catch (error) {
		console.error(`[getContentByType] Error loading content for ${type}:`, error);
		return [];
	}
}

// Get a single content item by type and slug
export async function getContentItem(
	type: string,
	slug: string,
	fetchFn: FetchFn
): Promise<ContentItem | null> {
	try {
		return storeGetContentBySlug(type, slug);
	} catch (error) {
		console.error(`[getContentItem] Error fetching item type '${type}', slug '${slug}':`, error);
		return null;
	}
}

// Get all content types (folders)
export async function getContentTypes(fetchFn?: FetchFn): Promise<string[]> {
	const cacheKey = 'contentFolders';
	// Check cache first
	if (contentTypeCache.has(cacheKey)) {
		return contentTypeCache.get(cacheKey) || [];
	}

	try {
		const contentMap = getAllContent();
		const types = Array.from(contentMap.keys());

		// Update cache
		contentTypeCache.set(cacheKey, types);
		return types;
	} catch (error) {
		console.error('[getContentTypes] Error:', error);
		return [];
	}
}

// Format slug to title case
function formatSlug(slug: string): string {
	return slug
		.split('-')
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(' ');
}

// Generate excerpt from content
function generateExcerpt(content: string): string {
	try {
		// Clean markdown content
		const cleanContent = content
			.replace(/#+\s+(.+)/g, '$1') // Extract heading text
			.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Replace links with just text
			.replace(/\*\*([^*]+)\*\*/g, '$1') // Remove bold
			.replace(/\*([^*]+)\*/g, '$1') // Remove italic
			.replace(/`([^`]+)`/g, '$1') // Remove inline code
			.replace(/```[\s\S]+?```/g, '') // Remove code blocks
			.replace(/!\[.*?\]\(.*?\)/g, '') // Remove images
			.replace(/\n{2,}/g, '\n\n') // Normalize line breaks
			.trim();

		// Find the first substantial paragraph
		const paragraphs = cleanContent.split('\n\n');

		// Look for any substantial paragraph
		for (const paragraph of paragraphs) {
			if (paragraph.trim().length >= 50) {
				const excerpt = paragraph.trim();
				return excerpt.length > 160 ? excerpt.substring(0, 157) + '...' : excerpt;
			}
		}

		// Fallback to first 160 chars of the cleaned content
		return cleanContent.length > 160 ? cleanContent.substring(0, 157) + '...' : cleanContent;
	} catch (error) {
		console.error('[generateExcerpt] Error:', error);
		return '';
	}
}

// Filter content by published status
export function filterPublishedContent(items: ContentItem[], isDev: boolean): ContentItem[] {
	return items.filter((item) => isDev || item.metadata?.published !== false);
}

/**
 * Gets all content types that have published content
 */
export async function getPublishedContentTypes(fetchFn: FetchFn): Promise<string[]> {
	if (!isGitHubConfigValid()) {
		console.warn(
			'[getPublishedContentTypes] Cannot get content types due to invalid GitHub config'
		);
		return [];
	}

	try {
		const contentTypes = await getContentTypes(fetchFn);
		if (!contentTypes.length) {
			console.warn('[getPublishedContentTypes] No content folders discovered');
			return [];
		}

		const publishedTypes: string[] = [];
		for (const type of contentTypes) {
			if (await hasPublishedContent(type, fetchFn)) {
				publishedTypes.push(type);
			}
		}
		return publishedTypes;
	} catch (error) {
		console.error('[getPublishedContentTypes] Error:', error);
		return [];
	}
}

/**
 * Checks if a specific content type has any published content
 */
export async function hasPublishedContent(contentType: string, fetchFn: FetchFn): Promise<boolean> {
	if (contentAvailabilityCache.has(contentType)) {
		return contentAvailabilityCache.get(contentType) as boolean;
	}

	if (!isGitHubConfigValid()) {
		console.warn(`[hasPublishedContent] Cannot check ${contentType} due to invalid GitHub config`);
		return false;
	}

	try {
		const entries = await loadContent(contentType, fetchFn);
		const isDev = process.env.NODE_ENV === 'development';
		const hasContent =
			entries.length > 0 && entries.some((entry) => isDev || entry.frontmatter.published !== false);

		contentAvailabilityCache.set(contentType, hasContent);
		return hasContent;
	} catch (error) {
		console.error(`[hasPublishedContent] Error checking ${contentType}:`, error);
		return false;
	}
}
