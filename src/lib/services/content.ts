// import { env } from '$env/dynamic/private';
import matter from 'gray-matter';
import { env } from '$env/dynamic/private';
import { loadContent } from '$lib/utils/github';

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

// Cache content to avoid excessive API calls
const contentCache = new Map<string, ContentItem[]>();
const contentTypeCache = new Map<string, string[]>();

// Define a type for the fetch function
type FetchFn = typeof fetch;

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

// Helper to fetch content from GitHub using their API
export async function fetchFromGitHub(path = '', fetchFn: FetchFn) {
	// Use server environment variables
	const githubToken = env.GITHUB_TOKEN;
	const contentPath = env.GITHUB_CONTENT_PATH || 'content';

	if (!githubToken) {
		throw new Error('GitHub token is not configured in environment variables');
	}

	// For content folders, we need to use the content path
	// But don't add it twice if it's already in the path
	const contentPrefix = path ? `${contentPath}/` : contentPath;
	const fullPath = path.startsWith(`${contentPath}/`)
		? path
		: path
			? `${contentPrefix}${path}`
			: contentPrefix;

	try {
		// Use the API endpoint instead of calling GitHub directly
		console.log(`Fetching content from GitHub API: ${fullPath}`);
		const response = await fetchFn(
			`/api/github?operation=fetchEntries&path=${encodeURIComponent(fullPath)}`
		);

		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(`API request failed: ${response.status} - ${errorText}`);
		}

		const data = await response.json();

		// More detailed error checking
		if (!data) {
			throw new Error('Empty response from API');
		}

		if (data.error) {
			throw new Error(`API error: ${data.error}`);
		}

		if (!data.repository) {
			throw new Error('Repository data missing from response');
		}

		if (!data.repository.object) {
			// If there's no object, it might be an empty directory or invalid path
			console.warn(`No content found at path: ${fullPath}`);
			return [];
		}

		// Handle both Tree and Blob responses
		if (data.repository.object.entries) {
			const entries = data.repository.object.entries
				.filter((entry: any) => entry.object?.text)
				.map((entry: any) => ({
					id: entry.name,
					markdown: entry.object.text
				}));

			return entries;
		} else if (data.repository.object.text) {
			return [
				{
					id: path.split('/').pop() || path,
					markdown: data.repository.object.text
				}
			];
		}

		// If we can't find any content but didn't error, return empty array
		return [];
	} catch (error) {
		console.error(`GitHub fetch error for path ${path}:`, error);
		throw error;
	}
}

// Helper to handle GitHub API retries
async function fetchWithRetry(path: string, fetchFn: FetchFn, maxRetries = 3): Promise<any[]> {
	let retries = maxRetries;
	let lastError;

	while (retries > 0) {
		try {
			const entries = await fetchFromGitHub(path, fetchFn);
			return entries;
		} catch (error) {
			lastError = error;
			retries--;

			if (retries === 0) break;

			// Simple exponential backoff
			await new Promise((resolve) => setTimeout(resolve, 2000 * (maxRetries - retries)));
		}
	}

	console.error(`Failed to fetch content after ${maxRetries} attempts:`, lastError);
	return [];
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
		console.error('Error generating excerpt:', error);
		return '';
	}
}

// Process markdown entries into content items
function processMarkdownEntries(entries: any[], type: string, isDev: boolean): ContentItem[] {
	console.log(`[processMarkdownEntries] Processing ${entries.length} entries for type: ${type}`); // Log input
	const processed = entries
		.map((entry) => {
			try {
				const { markdown } = entry;
				const { data: frontmatter, content } = matter(markdown);

				// Extract title or use filename as fallback
				const title = frontmatter.title || formatSlug(entry.id.replace(/\.(md|svx)$/, ''));

				// Handle dates with priority
				const dateField =
					frontmatter.created || frontmatter.date || new Date().toISOString().split('T')[0];

				// Extract or generate excerpt
				const excerpt = frontmatter.excerpt || generateExcerpt(content);

				// Extract slug from filename or use slug from frontmatter
				const slug = frontmatter.slug || entry.id.replace(/\.(md|svx)$/, '');

				// Extract all other metadata from frontmatter
				const metadata = { ...frontmatter };
				delete metadata.title;
				delete metadata.excerpt;
				delete metadata.date;
				delete metadata.created;
				delete metadata.slug;

				const processedItem = {
					slug,
					title,
					date: dateField,
					content,
					excerpt,
					type,
					metadata
				};
				// console.log('[processMarkdownEntries] Raw Frontmatter:', frontmatter); // Optional: Log raw frontmatter
				// console.log('[processMarkdownEntries] Processed Item (before filter):', processedItem); // Optional: Log item before filtering

				// Skip unpublished entries in production
				if (!isDev && frontmatter.published === false) {
					// console.log(`[processMarkdownEntries] Skipping unpublished item: ${title}`); // Optional: Log skipped items
					return null;
				}

				return processedItem;
			} catch (error) {
				console.error(`Error processing entry ${entry.id}:`, error);
				return null;
			}
		})
		.filter((item): item is ContentItem => item !== null);

	console.log(
		`[processMarkdownEntries] Outputting ${processed.length} processed items for type: ${type}`
	); // Log output
	return processed;
}

// Format slug to title case
function formatSlug(slug: string): string {
	return slug
		.split('-')
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(' ');
}

// Get content by type
export async function getContentByType(type: string, fetchFn: FetchFn): Promise<ContentItem[]> {
	// Check cache first
	if (contentCache.has(type)) {
		return contentCache.get(type) || [];
	}

	try {
		console.log(`Fetching content for type ${type} from GitHub...`);
		const entries = await fetchWithRetry(type, fetchFn);
		const isDev = process.env.NODE_ENV !== 'production';
		const processedEntries = processMarkdownEntries(entries, type, isDev).sort(
			(a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
		);

		// Update cache
		contentCache.set(type, processedEntries);
		return processedEntries;
	} catch (error) {
		console.error(`Error loading content for ${type}:`, error);
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
		const contentPathBase = env.GITHUB_CONTENT_PATH || 'content';
		const isDev = process.env.NODE_ENV !== 'production';

		// Function to attempt fetching and processing a single file path
		const fetchAndProcess = async (filePath: string): Promise<ContentItem | null> => {
			console.log(`[getContentItem] Attempting to fetch: ${filePath}`);
			const entries = await fetchWithRetry(filePath, fetchFn);

			if (entries && entries.length > 0) {
				console.log(`[getContentItem] Found entry for: ${filePath}`);
				// Assuming fetchWithRetry returns [{ id: 'filename.md', markdown: '...' }] for a single file
				// processMarkdownEntries expects an array and returns an array
				const processed = processMarkdownEntries(entries, type, isDev);
				if (processed.length > 0) {
					// Ensure the slug matches, as frontmatter might override filename slug
					if (processed[0].slug === slug) {
						return processed[0];
					} else {
						console.warn(
							`[getContentItem] Fetched file ${filePath} but slug mismatch: expected '${slug}', got '${processed[0].slug}'`
						);
						return null; // Slug doesn't match, treat as not found
					}
				}
			}
			console.log(`[getContentItem] No entry found for: ${filePath}`);
			return null;
		};

		// Try fetching with .md extension
		let item = await fetchAndProcess(`${contentPathBase}/${type}/${slug}.md`);

		// If not found, try fetching with .svx extension
		if (!item) {
			item = await fetchAndProcess(`${contentPathBase}/${type}/${slug}.svx`);
		}

		// If still not found, try fetching without extension (maybe it's just the slug name?)
		if (!item) {
			item = await fetchAndProcess(`${contentPathBase}/${type}/${slug}`);
		}

		if (!item) {
			console.log(
				`[getContentItem] Item not found for type '${type}', slug '${slug}' after checking extensions.`
			);
			// Optionally, fallback to the old method if needed, but ideally the direct fetch works
			// const items = await getContentByType(type, fetchFn);
			// return items.find((item) => item.slug === slug) || null;
			return null;
		}

		console.log(`[getContentItem] Successfully fetched and processed item: ${item.title}`);
		return item;
	} catch (error) {
		console.error(`[getContentItem] Error fetching item type '${type}', slug '${slug}':`, error);
		return null;
	}
}

// Get all content types (folders)
export async function getContentFolders(fetchFn?: FetchFn): Promise<string[]> {
	const cacheKey = 'contentFolders';
	// Check cache first
	if (contentTypeCache.has(cacheKey)) {
		return contentTypeCache.get(cacheKey) || [];
	}

	// Use the provided fetch function or fallback to the global fetch
	const actualFetch = fetchFn || fetch;

	try {
		console.log(
			'Fetching content folders from GitHub API using:',
			fetchFn ? 'provided fetch' : 'global fetch'
		);
		// Use actualFetch for the API call
		const response = await actualFetch('/api/github?operation=getFolders');

		if (!response.ok) {
			const errorText = await response.text();
			console.error(`Content folders API error: ${response.status} - ${errorText}`);
			return [];
		}

		const data = await response.json();

		// More detailed error checking
		if (!data) {
			console.error('Empty response from folders API');
			return [];
		}

		if (data.error) {
			console.error(`Folders API error: ${data.error}`);
			return [];
		}

		if (!data.repository || !data.repository.object) {
			console.error('Invalid folder structure response - repository or object missing');
			return [];
		}

		if (!data.repository.object.entries) {
			console.warn('Repository has no content folders');
			return [];
		}

		// Extract only directory entries (type: tree)
		const folders = data.repository.object.entries
			.filter((entry: any) => entry.type === 'tree')
			.map((entry: any) => entry.name);

		console.log(`Found ${folders.length} content folders: ${folders.join(', ')}`);

		// Update cache
		contentTypeCache.set(cacheKey, folders);
		return folders;
	} catch (error) {
		console.error('Error fetching content folders:', error);
		return [];
	}
}

// Filter content by published status
export function filterPublishedContent(items: ContentItem[], isDev: boolean): ContentItem[] {
	return items.filter((item) => isDev || item.metadata?.published !== false);
}

/**
 * Gets all content types that have published content
 * @param fetchFn - The fetch implementation to use
 * @returns A promise that resolves to an array of content types with published content
 */
export async function getPublishedContentTypes(fetchFn: FetchFn): Promise<string[]> {
	// Check GitHub config without importing validator
	if (!isGitHubConfigValid()) {
		// If config is invalid, log but return empty array
		console.warn('Cannot get published content types due to GitHub config issues');
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

	// Check config without importing validator
	if (!isGitHubConfigValid()) {
		console.warn(`Cannot check for published ${contentType} due to GitHub config issues`);
		return false;
	}

	try {
		// Load raw content for the specified type (returns github.ts ContentItem[])
		const rawContent = await loadContent(contentType, fetchFn);

		// Determine if running in development mode
		const isDev = process.env.NODE_ENV !== 'production';

		// Process the raw entries into the service's ContentItem format
		const processedContent = processMarkdownEntries(rawContent, contentType, isDev);

		// Filter the processed content for published items
		// filterPublishedContent now receives the correct ContentItem[] type
		const publishedItems = filterPublishedContent(processedContent, isDev);
		const hasContent = publishedItems.length > 0;

		// Update cache
		contentAvailabilityCache.set(contentType, hasContent);

		return hasContent;
	} catch (error) {
		console.error(`Error checking for published ${contentType}:`, error);
		return false;
	}
}
