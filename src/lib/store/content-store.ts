import { dev } from '$app/environment';
import type { ContentItem } from '$lib/types';
import { loadContent, getContentFolders } from '$lib/utils/github';
import type { RouteNode } from '$lib/utils/routes';

// Define a type for the fetch function to ensure consistency
type FetchFn = typeof fetch;

interface ContentStore {
	contentTypes: string[];
	contentMap: Map<string, ContentItem[]>;
	routes: RouteNode[];
	lastUpdated: Date;
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
): ContentItem {
	return {
		title: githubItem.frontmatter.title,
		slug: githubItem.frontmatter.slug,
		date: githubItem.frontmatter.created, // Assuming 'created' maps to 'date'
		excerpt: githubItem.content?.split('\n')[0], // Optional: generate excerpt if content exists
		metadata: {
			updated: githubItem.frontmatter.updated,
			published: githubItem.frontmatter.published,
			tags: githubItem.frontmatter.tags
		}
	};
}

export async function initializeStore(fetchFn: FetchFn): Promise<ContentStore> {
	// If recent fetch attempt failed, use cooldown
	const now = Date.now();
	if (now - lastFetchAttempt < FETCH_COOLDOWN) {
		return store || getDefaultStore();
	}

	// Prevent multiple initializations running concurrently
	if (initializationPromise) {
		return initializationPromise;
	}

	// If store exists and is recent enough (e.g., 1 hour in prod), return it
	if (store && !dev && Date.now() - store.lastUpdated.getTime() < 3600000) {
		return store;
	}

	// Set last fetch attempt time
	lastFetchAttempt = now;

	initializationPromise = (async () => {
		try {
			console.log('Initializing content store...');

			// Retry logic for fetching content folders
			let contentTypes: string[] = [];
			let retries = 2; // Reduced from 3 to 2

			while (retries > 0) {
				try {
					contentTypes = await getContentFolders(fetchFn);
					break; // Success, exit the retry loop
				} catch (folderError) {
					retries--;
					console.error(`Error fetching content folders (retries left: ${retries}):`, folderError);
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
								// Load content (returns github.ts ContentItem[])
								const rawContent = await loadContent(type, fetchFn);
								// Transform to the global ContentItem[] type
								const content = rawContent.map(transformGithubItemToGlobalItem);

								if (content.length > 0 || dev) {
									contentMap.set(type, content); // Now using the correct type

									// Add to content children - remove the /content prefix since it's added by the parent route
									contentChildren.push({
										path: `/${type}`,
										label: type
											.split('-')
											.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
											.join(' ')
									});
								}
							} catch (typeError) {
								console.error(`Error loading content for type ${type}:`, typeError);
								// Continue with other content types
							}
						})
					),
					fetchTimeout
				]);
			} catch (timeoutError) {
				console.error('Content fetching timed out:', timeoutError);
				// Continue with partial data
			}

			// Add content route with children if we have any content types
			if (contentChildren.length > 0 || dev) {
				routes.push({
					path: '/content',
					label: 'Content',
					children: contentChildren
				});
			}

			store = {
				contentTypes,
				contentMap,
				routes,
				lastUpdated: new Date()
			};

			console.log('Content store initialized.');
			return store;
		} catch (error) {
			console.error('Failed to initialize content store:', error);
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

export function getContentForType(type: string): ContentItem[] {
	return store?.contentMap.get(type) || [];
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
