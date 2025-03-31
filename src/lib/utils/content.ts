// This module should be imported only from server components or server code
// This is a SvelteKit convention for server-only modules
export const server = true; // Mark as server-only

import { loadContent, getContentFolders as fetchGitHubContentFolders } from './github';
import { validateGitHubConfig } from '../server/config-validator';
import { dev } from '$app/environment';
import type { ContentItem } from '$lib/types/content';

// Cache for content availability status
const contentAvailabilityCache = new Map<string, boolean>();
// Cache for content folders
let contentFoldersCache: string[] | null = null;

// Define a type for the fetch function
type FetchFn = typeof fetch;

/**
 * Filter content items based on published status
 * In development mode, show all content
 * In production mode, only show published content
 */
export function filterPublishedContent<T extends { metadata?: { published?: boolean } }>(
	items: T[],
	isDev = false
): T[] {
	return items.filter((item) => isDev || item.metadata?.published !== false);
}

/**
 * Gets all available content folders from the CMS
 * @param fetchFn - The fetch implementation to use (global or event.fetch)
 * @returns A promise that resolves to an array of content folder names
 */
export async function getContentFolders(fetchFn: FetchFn): Promise<string[]> {
	// Check cache first (simple cache, consider invalidation if needed)
	if (contentFoldersCache) {
		return contentFoldersCache;
	}

	// Fetch folders dynamically from GitHub, passing fetchFn
	const folders = await fetchGitHubContentFolders(fetchFn);
	contentFoldersCache = folders; // Update cache
	return folders;
}

/**
 * Checks if a specific content type has any published content
 * @param contentType - The content type to check (posts, art, notes, recipes)
 * @param fetchFn - The fetch implementation to use
 * @returns A promise that resolves to true if there is published content, false otherwise
 */
export async function hasPublishedContent(contentType: string, fetchFn: FetchFn): Promise<boolean> {
	// Check cache first
	if (contentAvailabilityCache.has(contentType)) {
		return contentAvailabilityCache.get(contentType) as boolean;
	}

	// Validate GitHub configuration first
	const configErrors = validateGitHubConfig();
	if (configErrors.length > 0) {
		// Log the error but don't throw - return false to indicate no content
		console.warn(
			`Cannot check for published ${contentType} due to GitHub config issues:`,
			configErrors
		);
		return false;
	}

	try {
		// Load content for the specified type - Pass fetchFn
		const content = await loadContent(contentType, fetchFn);

		// Create content items in the right format to use filterPublishedContent
		const contentItems = content.map((item) => ({
			...item,
			metadata: {
				...item.frontmatter
			}
		}));

		// Use the filterPublishedContent utility to apply consistent filtering logic
		const publishedItems = filterPublishedContent(contentItems, dev);
		const hasContent = publishedItems.length > 0;

		// Update cache
		contentAvailabilityCache.set(contentType, hasContent);

		return hasContent;
	} catch (error) {
		console.error(`Error checking for published ${contentType}:`, error);
		return false;
	}
}

/**
 * Gets all content types that have published content
 * @param fetchFn - The fetch implementation to use
 * @returns A promise that resolves to an array of content types with published content
 */
export async function getPublishedContentTypes(fetchFn: FetchFn): Promise<string[]> {
	// Validate GitHub configuration first
	const configErrors = validateGitHubConfig();
	if (configErrors.length > 0) {
		// If config is invalid, log but return empty array
		console.warn('Cannot get published content types due to GitHub config issues:', configErrors);
		return [];
	}

	try {
		// Get content folders dynamically - Pass fetchFn
		const contentTypes = await getContentFolders(fetchFn);
		if (!contentTypes.length) {
			console.warn('No content folders discovered');
			return [];
		}

		const publishedTypes: string[] = [];

		for (const type of contentTypes) {
			// Pass fetchFn to hasPublishedContent
			if (await hasPublishedContent(type, fetchFn)) {
				publishedTypes.push(type);
			}
		}
		return publishedTypes;
	} catch (error) {
		console.error('Error getting published content types:', error);
		return [];
	}
}

/**
 * Formats a content type string for display
 * Converts kebab-case to Title Case (e.g., "blog-posts" to "Blog Posts")
 */
export function formatContentType(type: string): string {
	return type
		.split('-')
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(' ');
}

// Format date for display
export function formatDate(dateString: string): string {
	return new Date(dateString).toLocaleDateString('en-US', {
		year: 'numeric',
		month: 'long',
		day: 'numeric'
	});
}

// Format date for list view (more compact)
export function formatListDate(dateString: string): string {
	const date = new Date(dateString);
	const now = new Date();
	const isCurrentYear = date.getFullYear() === now.getFullYear();

	// If current year, don't show the year
	if (isCurrentYear) {
		return date.toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric'
		});
	}

	return date.toLocaleDateString('en-US', {
		year: 'numeric',
		month: 'short',
		day: 'numeric'
	});
}
