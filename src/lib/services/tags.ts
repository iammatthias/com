import {
	getContentByTag as storeGetContentByTag,
	getContentTags as storeGetContentTags
} from '$lib/store/content-store';
import type { ContentItem } from '$lib/types';

// Cache for tag data
const tagCache = new Map<string, ContentItem[]>();
let allTagsCache: string[] | null = null;

/**
 * Get all content items with a specific tag across all content types
 */
export async function getContentByTag(tag: string, fetchFn?: typeof fetch): Promise<ContentItem[]> {
	try {
		// Check cache first
		if (tagCache.has(tag)) {
			return tagCache.get(tag) || [];
		}

		const taggedContent = storeGetContentByTag(tag);

		// Save to cache
		tagCache.set(tag, taggedContent);

		return taggedContent;
	} catch (error) {
		console.error(`Error fetching content with tag ${tag}:`, error);
		throw error; // Re-throw to handle in the page load function
	}
}

/**
 * Get all tags used across all content types
 */
export async function getAllTags(fetchFn?: typeof fetch): Promise<string[]> {
	try {
		// Use cache if available
		if (allTagsCache !== null) {
			return allTagsCache;
		}

		const allTags = storeGetContentTags();
		allTagsCache = allTags;

		return allTags;
	} catch (error) {
		console.error('Error getting all tags:', error);
		throw error; // Re-throw to handle in the page load function
	}
}
