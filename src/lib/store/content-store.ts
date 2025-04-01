import { dev } from '$app/environment';
import type { ContentItem } from '$lib/types';
import { loadContent, getContentFolders } from '$lib/utils/github';
import type { RouteNode } from '$lib/utils/routes';

export type { ContentItem };

// Define a type for the fetch function to ensure consistency
type FetchFn = typeof fetch;

interface ContentStore {
	contentTypes: string[];
	contentMap: Map<string, ContentItem[]>;
	routes: RouteNode[];
	lastUpdated: Date;
}

// Helper function to filter content based on environment
function filterContent(content: ContentItem[]): ContentItem[] {
	if (dev) {
		return content;
	}
	return content.filter((item) => item.metadata?.published !== false);
}

// Helper function to sort content by date
function sortContent(content: ContentItem[]): ContentItem[] {
	return content.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

let store: ContentStore | null = null;
let initializationPromise: Promise<ContentStore> | null = null;
let lastFetchAttempt = 0;
const FETCH_COOLDOWN = 10000; // 10 seconds between fetch attempts

// Minimal default store when errors occur
const getDefaultStore = (): ContentStore => ({
	contentTypes: [],
	contentMap: new Map(),
	routes: [
		{ path: '/', label: 'Home' },
		{ path: '/bio', label: 'Bio' }
	],
	lastUpdated: new Date()
});

// Function to transform the data structure from github.ts ContentItem to types/index.ts ContentItem
function transformGithubItemToGlobalItem(
	githubItem: import('$lib/utils/github').ContentItem
): import('$lib/services/content').ContentItem {
	const frontmatter = githubItem.frontmatter as Record<string, any>;
	const title = frontmatter.title || formatSlug(frontmatter.slug);
	const date = frontmatter.created || new Date().toISOString().split('T')[0];
	const excerpt = frontmatter.excerpt || githubItem.content?.split('\n')[0] || '';
	const type = frontmatter.path?.split('/')[0] || '';

	// Extract all other metadata from frontmatter
	const metadata = { ...frontmatter };
	const fieldsToDelete = ['title', 'excerpt', 'date', 'created', 'slug'];
	fieldsToDelete.forEach((field) => {
		if (field in metadata) {
			delete metadata[field];
		}
	});

	return {
		slug: frontmatter.slug,
		title,
		date,
		content: githubItem.content,
		excerpt,
		type,
		metadata
	};
}

// Helper to format slug to title case
function formatSlug(slug: string): string {
	return slug
		.split('-')
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(' ');
}

export async function initializeStore(fetchFn: FetchFn): Promise<ContentStore> {
	// If recent fetch attempt failed, use cooldown
	const now = Date.now();
	if (now - lastFetchAttempt < FETCH_COOLDOWN) {
		console.log('[initializeStore] Using cooldown, returning existing store');
		return store || getDefaultStore();
	}

	// Prevent multiple initializations running concurrently
	if (initializationPromise) {
		console.log('[initializeStore] Initialization already in progress');
		return initializationPromise;
	}

	// If store exists and is recent enough (e.g., 1 hour in prod), return it
	if (store && !dev && Date.now() - store.lastUpdated.getTime() < 3600000) {
		console.log('[initializeStore] Using cached store');
		return store;
	}

	// Set last fetch attempt time
	lastFetchAttempt = now;

	initializationPromise = (async () => {
		try {
			console.log('[initializeStore] Starting content store initialization...');

			// Retry logic for fetching content folders
			let contentTypes: string[] = [];
			let retries = 2; // Reduced from 3 to 2

			while (retries > 0) {
				try {
					contentTypes = await getContentFolders(fetchFn);
					console.log('[initializeStore] Found content types:', contentTypes);
					break; // Success, exit the retry loop
				} catch (folderError) {
					retries--;
					console.error(
						`[initializeStore] Error fetching content folders (retries left: ${retries}):`,
						folderError
					);
					if (retries === 0) throw folderError;
					// Wait before retrying
					await new Promise((resolve) => setTimeout(resolve, 1000));
				}
			}

			const contentMap = new Map<string, ContentItem[]>();

			// Initialize base routes
			const routes: RouteNode[] = [
				{ path: '/', label: 'Home' },
				{ path: '/bio', label: 'Bio' }
			];

			// Create content routes
			const contentChildren: RouteNode[] = [];

			// Set a timeout for the entire content fetching process
			const fetchTimeout = new Promise<void>((_, reject) => {
				setTimeout(() => reject(new Error('Content fetching timed out')), 10000);
			});

			// Load all content in parallel with a timeout
			try {
				await Promise.race([
					Promise.all(
						contentTypes.map(async (type) => {
							try {
								console.log(`[initializeStore] Loading content for type: ${type}`);
								// Load content (returns github.ts ContentItem[])
								const rawContent = await loadContent(type, fetchFn);
								console.log(
									`[initializeStore] Raw content for ${type}:`,
									rawContent.length,
									'items'
								);

								// Transform to the global ContentItem[] type
								const content = rawContent.map(transformGithubItemToGlobalItem);
								console.log(
									`[initializeStore] Transformed content for ${type}:`,
									content.length,
									'items'
								);

								if (content.length > 0 || dev) {
									// Sort content before storing in the map
									contentMap.set(type, sortContent(content));

									// Add to content children - remove the /content prefix since it's added by the parent route
									contentChildren.push({
										path: `/content/${type}`,
										label: type
											.split('-')
											.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
											.join(' ')
									});
									console.log(`[initializeStore] Added route for ${type}`);
								}
							} catch (typeError) {
								console.error(
									`[initializeStore] Error loading content for type ${type}:`,
									typeError
								);
								// Continue with other content types
							}
						})
					),
					fetchTimeout
				]);
			} catch (timeoutError) {
				console.error('[initializeStore] Content fetching timed out:', timeoutError);
				// Continue with partial data
			}

			// Add content route with children if we have any content types
			if (contentChildren.length > 0 || dev) {
				routes.push({
					path: '/content',
					label: 'Content',
					children: contentChildren
				});
				console.log('[initializeStore] Added content routes:', contentChildren.length, 'routes');
			}

			store = {
				contentTypes,
				contentMap,
				routes,
				lastUpdated: new Date()
			};

			console.log('[initializeStore] Content store initialized with:', {
				contentTypes: contentTypes.length,
				contentMapSize: contentMap.size,
				routes: routes.length
			});
			return store;
		} catch (error) {
			console.error('[initializeStore] Failed to initialize content store:', error);
			// In case of error, return a minimal default store
			store = getDefaultStore();
			return store;
		} finally {
			initializationPromise = null; // Reset promise once done
		}
	})();

	return initializationPromise;
}

export async function getStore(fetchFn: FetchFn): Promise<ContentStore> {
	return store || initializeStore(fetchFn);
}

export async function refreshStore(fetchFn: FetchFn): Promise<ContentStore> {
	// Only allow refresh if enough time has passed since last attempt
	const now = Date.now();
	if (now - lastFetchAttempt < FETCH_COOLDOWN) {
		console.log('Skipping store refresh: too soon since last attempt');
		return store || getDefaultStore();
	}

	store = null;
	initializationPromise = null; // Clear any ongoing initialization
	return initializeStore(fetchFn);
}

export function getContentForType(type: string, shouldFilter = true): ContentItem[] {
	const content = store?.contentMap.get(type) || [];
	return shouldFilter ? filterContent(content) : content;
}

export function getAllContent(shouldFilter = true): Map<string, ContentItem[]> {
	if (!store) {
		return new Map();
	}

	if (!shouldFilter) {
		return store.contentMap;
	}

	const filteredMap = new Map<string, ContentItem[]>();
	store.contentMap.forEach((content, type) => {
		filteredMap.set(type, filterContent(content));
	});
	return filteredMap;
}

export function getContentBySlug(
	type: string,
	slug: string,
	shouldFilter = true
): ContentItem | null {
	const content = getContentForType(type, shouldFilter);
	return content.find((item) => item.slug === slug) || null;
}

export function getContentTags(type?: string, shouldFilter = true): string[] {
	const tagSet = new Set<string>();
	const content = type
		? getContentForType(type, shouldFilter)
		: Array.from(getAllContent(shouldFilter).values()).flat();

	content.forEach((item) => {
		const tags = item.metadata?.tags;
		if (!tags) return;

		if (Array.isArray(tags)) {
			tags.forEach((tag) => tagSet.add(tag.toLowerCase().trim()));
		} else if (typeof tags === 'string') {
			tags
				.split(',')
				.map((t) => t.trim().toLowerCase())
				.forEach((tag) => tagSet.add(tag));
		}
	});

	return Array.from(tagSet);
}

export function getContentByTag(tag: string, shouldFilter = true): ContentItem[] {
	const normalizedTag = tag.toLowerCase().trim();
	const allContent = Array.from(getAllContent(shouldFilter).values()).flat();

	return allContent.filter((item) => {
		const tags = item.metadata?.tags;
		if (!tags) return false;

		if (Array.isArray(tags)) {
			return tags.some((t) => t.toLowerCase().trim() === normalizedTag);
		}
		if (typeof tags === 'string') {
			return tags
				.split(',')
				.map((t) => t.trim().toLowerCase())
				.includes(normalizedTag);
		}
		return false;
	});
}

export function getAllRoutes(): RouteNode[] {
	return (
		store?.routes || [
			{ path: '/', label: 'Home' },
			{ path: '/bio', label: 'Bio' }
		]
	);
}

export function getLastUpdated(): Date | null {
	return store?.lastUpdated || null;
}

// Helper to check if content exists for a type
export function hasContent(type: string): boolean {
	const content = store?.contentMap.get(type);
	return Boolean(content && content.length > 0);
}
