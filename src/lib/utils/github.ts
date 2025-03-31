import matter from 'gray-matter';

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
	try {
		const response = await fetchFn(
			`/api/github?operation=fetchEntries&path=${encodeURIComponent(path)}`
		);
		if (!response.ok) {
			const errorText = await response.text();
			console.error('GitHub API error:', {
				status: response.status,
				error: errorText,
				path
			});
			throw new Error(`GitHub API request failed: ${response.status} - ${errorText}`);
		}

		const result = await response.json();

		if (!result.repository) {
			console.error('GitHub repository data missing:', {
				result,
				path
			});
			throw new Error('Repository data not found or not accessible');
		}

		// Handle both Tree and Blob responses
		if (result.repository.object?.entries?.length) {
			const entries = result.repository.object.entries
				.filter((entry: any) => entry.object?.text)
				.map((entry: any) => ({
					id: entry.name,
					markdown: entry.object.text
				}));

			if (entries.length === 0) {
				console.warn('No markdown entries found:', {
					path,
					totalEntries: result.repository.object.entries.length
				});
			}

			return entries;
		} else if (result.repository.object?.text) {
			return [
				{
					id: path.split('/').pop() || path,
					markdown: result.repository.object.text
				}
			];
		}

		console.error('Unexpected GitHub response structure:', {
			data: result,
			path
		});
		throw new Error(`No valid data returned from GitHub for path: ${path}`);
	} catch (error) {
		console.error('GitHub fetch error:', {
			error: error instanceof Error ? error.message : 'Unknown error',
			path
		});
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
		})
		.filter((entry): entry is ContentItem => entry !== null);
}

// Helper to handle GitHub API retries
export async function fetchWithRetry(
	path: string,
	fetchFn: FetchFn,
	maxRetries = 3,
	baseDelay = 2000
): Promise<any[]> {
	let retries = maxRetries;
	let delay = baseDelay;

	while (retries > 0) {
		try {
			// Correctly call the internal API endpoint using fetchFn
			const apiUrl = `/api/github?operation=fetchEntries&path=${encodeURIComponent(path)}`;
			console.log(`[fetchWithRetry] Calling: ${apiUrl}`); // Log the API call
			const response = await fetchFn(apiUrl);

			if (!response.ok) {
				const errorText = await response.text();
				// Distinguish between 404 (potentially valid, just no content) and other errors
				if (response.status === 404) {
					console.warn(`[fetchWithRetry] Content not found (404) for path: ${path}`);
					return []; // Return empty array if path not found
				}
				// Throw an error for other non-ok statuses to potentially trigger retry
				throw new Error(
					`API request failed for path ${path}: ${response.status} ${response.statusText} - ${errorText}`
				);
			}

			const data = await response.json();

			// Adapt based on the structure returned by the API endpoint
			// The endpoint returns { repository: { object: { ... } } }
			if (!data.repository?.object) {
				console.warn(`[fetchWithRetry] Unexpected data structure for path ${path}:`, data);
				return []; // Return empty if structure is wrong
			}

			const objectData = data.repository.object;

			// Handle both Tree and Blob responses from the unified query
			if (objectData.__typename === 'Tree' && objectData.entries) {
				// Filter for entries that are Blobs and have text content
				return objectData.entries
					.filter((entry: any) => entry.type === 'blob' && entry.object?.text)
					.map((entry: any) => ({
						id: entry.name, // Use name as ID
						markdown: entry.object.text
					}));
			} else if (objectData.__typename === 'Blob' && objectData.text) {
				// If the path directly points to a file, return it as a single-item array
				return [
					{
						id: path.split('/').pop() || path, // Extract filename for ID
						markdown: objectData.text
					}
				];
			} else {
				console.warn(`[fetchWithRetry] No valid Tree entries or Blob text found for path ${path}`);
				return []; // Return empty if neither Tree with valid entries nor Blob found
			}
		} catch (error) {
			console.error(
				`[fetchWithRetry] Error fetching path ${path} (retries left: ${retries - 1}):`,
				error
			);
			retries--;
			if (retries === 0) {
				console.error(`[fetchWithRetry] Max retries reached for path ${path}. Giving up.`);
				throw error; // Re-throw the final error after retries are exhausted
			}

			if (error instanceof Error) {
				// Optional: Check for specific error types that shouldn't be retried (e.g., 400 Bad Request)
				// if (error.message.includes('400 Bad Request')) throw error;

				// Basic exponential backoff for retries
				await new Promise((resolve) => setTimeout(resolve, delay));
				delay *= 2;
				console.log(`[fetchWithRetry] Retrying path ${path} after delay...`);
			} else {
				// If it's not an Error instance, re-throw immediately
				throw error;
			}
		}
	}
	// Should not be reached if retries > 0, but provides a fallback
	console.error(`[fetchWithRetry] Failed to fetch path ${path} after multiple retries.`);
	return [];
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

		// Path is expected to be relative to GITHUB_CONTENT_PATH
		// The API endpoint /api/github will add the base path
		const entries = await fetchWithRetry(path, fetchFn); // Pass path directly
		const isDev = import.meta.env.DEV;
		const processedEntries = await processMarkdownEntries(entries, path, isDev);

		// Cache the results
		contentCache.set(path, processedEntries);
		return processedEntries;
	} catch (error) {
		console.error(`Error loading content for ${path}:`, error);
		throw error;
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
		// Make sure we're using the provided fetchFn, not global fetch
		const response = await fetchFn('/api/github?operation=getFolders');
		if (!response.ok) {
			const errorText = await response.text(); // Get error details
			console.error(`Failed to fetch content folders (${response.status}): ${errorText}`);
			throw new Error(`Failed to fetch content folders: ${response.status}`);
		}

		const result = await response.json();
		if (!result.repository?.object?.entries) {
			console.error('Unexpected response structure for content folders');
			return [];
		}

		// Filter for directories only
		return result.repository.object.entries
			.filter((entry: { type: string }) => entry.type === 'tree')
			.map((entry: { name: string }) => entry.name);
	} catch (error) {
		console.error('Error fetching content folders:', error);
		throw error; // Rethrow the error for better error handling upstream
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
		const entries = await fetchWithRetry(path, fetchFn); // Pass path directly

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
		const entries = await fetchWithRetry(path, fetchFn); // Pass path directly

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
