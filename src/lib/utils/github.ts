import matter from 'gray-matter';
import { env } from '$env/dynamic/private';

// Define a type for the fetch function to ensure consistency
type FetchFn = typeof fetch;

export interface ContentItem {
	frontmatter: {
		title: string;
		slug: string;
		created: string;
		updated: string;
		published: boolean;
		tags: string[];
		path: string;
	};
	content: string;
	markdown: string;
}

// Helper to fetch content from GitHub using their API
export async function fetchFromGitHub(path = '', fetchFn: FetchFn) {
	const contentPath = env.GITHUB_CONTENT_PATH || 'content';

	// For content folders, we need to use the content path
	// But don't add it twice if it's already in the path
	const contentPrefix = path ? `${contentPath}/` : contentPath;
	const fullPath = path.startsWith(`${contentPath}/`)
		? path
		: path
			? `${contentPrefix}${path}`
			: contentPrefix;

	try {
		console.log(`[fetchFromGitHub] Fetching content from path: ${fullPath}`);
		const response = await fetchFn(
			`/api/github?operation=fetchEntries&path=${encodeURIComponent(fullPath)}`
		);

		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(`API request failed: ${response.status} - ${errorText}`);
		}

		const result = await response.json();
		console.log(`[fetchFromGitHub] Raw response for ${fullPath}:`, JSON.stringify(result, null, 2));

		if (!result.success || !result.data?.repository?.object) {
			console.warn(`[fetchFromGitHub] No content found at path: ${fullPath}`);
			return [];
		}

		const objectData = result.data.repository.object;

		// Handle directory (Tree) response
		if (objectData.__typename === 'Tree' && objectData.entries) {
			return objectData.entries
				.filter((entry: any) => entry.object?.text)
				.map((entry: any) => ({
					id: entry.name,
					markdown: entry.object.text
				}));
		}

		// Handle single file (Blob) response
		if (objectData.__typename === 'Blob' && objectData.text) {
			return [
				{
					id: path.split('/').pop() || path,
					markdown: objectData.text
				}
			];
		}

		console.warn(`[fetchFromGitHub] Unexpected response structure for path: ${fullPath}`);
		return [];
	} catch (error) {
		console.error(`[fetchFromGitHub] Error fetching content:`, error);
		throw error;
	}
}

// Helper to process markdown entries
export async function processMarkdownEntries(
	entries: any[],
	path: string,
	isDev: boolean
): Promise<ContentItem[]> {
	return entries
		.map((entry) => {
			try {
				const { markdown } = entry;
				const { data: frontmatter, content } = matter(markdown);

				// Skip unpublished entries in production
				if (!isDev && !frontmatter.published) {
					return null;
				}

				return {
					frontmatter: {
						...frontmatter,
						path
					},
					content,
					markdown
				} as ContentItem;
			} catch (error) {
				console.error(`[processMarkdownEntries] Error processing entry ${entry.id}:`, error);
				return null;
			}
		})
		.filter((entry): entry is ContentItem => entry !== null);
}

// Cache for content data
const contentCache = new Map<string, ContentItem[]>();

// Helper to load content for a specific path
export async function loadContent(path: string, fetchFn: FetchFn): Promise<ContentItem[]> {
	try {
		// Check cache first
		if (contentCache.has(path)) {
			console.log(`[GitHub] Using cached content collection for ${path}`);
			return contentCache.get(path) || [];
		}

		console.log(`[GitHub] Loading content for path: ${path}`);
		const entries = await fetchFromGitHub(path, fetchFn);
		const isDev = process.env.NODE_ENV === 'development';
		const processedEntries = await processMarkdownEntries(entries, path, isDev);

		// Cache the results
		contentCache.set(path, processedEntries);
		return processedEntries;
	} catch (error) {
		console.error(`[GitHub] Error loading content for ${path}:`, error);
		return [];
	}
}

// Helper to extract tags from all content
export async function getAllTags(fetchFn: FetchFn): Promise<Record<string, ContentItem[]>> {
	try {
		// Get content folders dynamically instead of hardcoding them
		const collections = await getContentFolders(fetchFn);
		const tagMap: Record<string, ContentItem[]> = {};

		// Load all content first
		const contentPromises = collections.map((path) => loadContent(path, fetchFn));
		const contentResults = await Promise.all(contentPromises);

		// Process content for tags
		collections.forEach((path, index) => {
			const entries = contentResults[index];
			if (!entries?.length) {
				console.warn(`No valid entries found for ${path}`);
				return;
			}

			entries.forEach((entry) => {
				if (!entry.frontmatter?.tags?.length) return;

				entry.frontmatter.tags.forEach((tag: string) => {
					const normalizedTag = tag.toLowerCase().trim();
					if (!tagMap[normalizedTag]) {
						tagMap[normalizedTag] = [];
					}
					tagMap[normalizedTag].push(entry);
				});
			});
		});

		return tagMap;
	} catch (error) {
		console.error(
			`Error processing tags: ${error instanceof Error ? error.message : 'Unknown error'}`
		);
		return {};
	}
}

// New function to dynamically discover content folders
export async function getContentFolders(fetchFn: FetchFn): Promise<string[]> {
	try {
		const response = await fetchFn('/api/github?operation=getFolders');
		if (!response.ok) {
			const errorText = await response.text();
			console.error(`Failed to fetch content folders (${response.status}): ${errorText}`);
			throw new Error(`Failed to fetch content folders: ${response.status}`);
		}

		const result = await response.json();

		if (!result.data?.repository?.object?.entries) {
			console.error('Unexpected response structure for content folders:', result);
			return [];
		}

		// Filter for directories only
		return result.data.repository.object.entries
			.filter((entry: { type: string }) => entry.type === 'tree')
			.map((entry: { name: string }) => entry.name);
	} catch (error) {
		console.error('Error fetching content folders:', error);
		return [];
	}
}

// Glass loader function
export async function fetchGlassFeed(fetchFn: FetchFn): Promise<any[]> {
	try {
		const response = await fetchFn('/api/github?operation=fetchEntries&path=glass');
		if (!response.ok) {
			throw new Error(`Failed to fetch Glass feed: ${response.status}`);
		}
		const data = await response.json();
		return data;
	} catch (error) {
		console.error('Error fetching Glass feed:', error);
		throw error;
	}
}

/**
 * Fetches all markdown files from a given path in the GitHub repository.
 * Assumes the path points to a directory (Tree object).
 * @param path - The directory path within the repository (e.g., 'posts')
 * @param fetchFn - The fetch implementation to use
 */
export async function getAllMarkdownContent(path: string, fetchFn: FetchFn): Promise<GitHubFile[]> {
	try {
		// Path is expected to be relative to GITHUB_CONTENT_PATH
		// The API endpoint /api/github will add the base path
		const entries = await fetchFromGitHub(path, fetchFn); // Pass path directly

		// Process entries into GitHubFile format
		return entries
			.filter((entry: any) => entry.id.endsWith('.md')) // Ensure it's a markdown file
			.map((entry: any) => {
				const { data: frontmatter, content } = matter(entry.markdown);
				return {
					slug: entry.id.replace(/\.md$/, ''), // Remove .md extension for slug
					path: `${path}/${entry.id}`,
					content,
					frontmatter
				};
			});
	} catch (error) {
		console.error(`Error fetching all markdown content for path ${path}:`, error);
		return []; // Return empty array on error
	}
}

/**
 * Fetches a single markdown file from a given path in the GitHub repository.
 * Assumes the path points to a specific file (Blob object).
 * @param path - The full file path within the repository (e.g., 'posts/my-post.md')
 * @param fetchFn - The fetch implementation to use
 */
export async function getMarkdownFile(path: string, fetchFn: FetchFn): Promise<GitHubFile> {
	try {
		// Path is expected to be relative to GITHUB_CONTENT_PATH
		// The API endpoint /api/github will add the base path
		const entries = await fetchFromGitHub(path, fetchFn); // Pass path directly

		if (!entries || entries.length === 0 || !entries[0]?.markdown) {
			throw new Error(`No content found for path: ${path}`);
		}

		const entry = entries[0];
		const { data: frontmatter, content } = matter(entry.markdown);
		const slug = path.split('/').pop()?.replace(/\.md$/, '') || path; // Extract slug from path

		return {
			slug,
			path,
			content,
			frontmatter
		};
	} catch (error) {
		console.error(`Error fetching markdown file for path ${path}:`, error);
		throw error; // Rethrow error to be handled by caller
	}
}

// Define the GitHubFile interface (if not already defined globally)
// This should match the structure returned by the functions above
export interface GitHubFile {
	slug: string;
	path: string;
	content: string;
	frontmatter: Record<string, any>;
}
