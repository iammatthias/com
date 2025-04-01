import { env } from '$env/dynamic/private';
import matter from 'gray-matter';

// Mark this as a server-only module
export const server = true;

/**
 * Types for GitHub API responses and content objects
 */
export interface GitHubContent {
	name: string;
	path: string;
	sha: string;
	size: number;
	url: string;
	html_url: string;
	git_url: string;
	download_url: string | null;
	type: 'file' | 'dir';
	content?: string;
	encoding?: 'base64';
	id?: string; // Added for folder listing compatibility
}

export interface GitHubFile {
	content: string;
	path: string;
	slug: string;
	frontmatter: {
		title?: string;
		date?: string;
		category?: string;
		tags?: string[] | string;
		path: string;
		excerpt?: string;
		published?: boolean;
		[key: string]: unknown;
	};
}

/**
 * Cache configuration
 */
interface CacheEntry<T> {
	data: T;
	timestamp: number;
}

const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds
const contentCache = new Map<string, CacheEntry<GitHubContent[]>>();
const fileCache = new Map<string, CacheEntry<GitHubFile>>();
const dirContentCache = new Map<string, CacheEntry<GitHubFile[]>>();
const folderCache = new Map<string, CacheEntry<string[]>>();

/**
 * Make authenticated request to GitHub API using REST
 */
async function fetchFromGitHubREST(path: string): Promise<Response> {
	if (!env.GITHUB_TOKEN) {
		throw new Error('GitHub token is required. Please set the GITHUB_TOKEN environment variable.');
	}

	const url = `https://api.github.com/repos/${env.GITHUB_REPO_OWNER}/${env.GITHUB_REPO_NAME}/contents/${path}`;

	return fetch(url, {
		headers: {
			Accept: 'application/vnd.github.v3+json',
			Authorization: `token ${env.GITHUB_TOKEN}`,
			'X-GitHub-Api-Version': '2022-11-28',
			'User-Agent': 'SvelteKit-App'
		}
	});
}

/**
 * Check if cache entry is valid
 */
function isCacheValid<T>(cache: Map<string, CacheEntry<T>>, key: string): boolean {
	const entry = cache.get(key);
	const now = Date.now();
	return !!entry && now - entry.timestamp < CACHE_DURATION;
}

/**
 * List all markdown files in a directory
 */
export async function listMarkdownFiles(
	path: string = env.GITHUB_CONTENT_PATH
): Promise<GitHubContent[]> {
	if (isCacheValid(contentCache, path)) {
		console.log(`[GitHub] Using cached directory listing for ${path}`);
		return contentCache.get(path)!.data;
	}

	try {
		console.log(`[GitHub] Fetching directory listing for ${path}`);
		const response = await fetchFromGitHubREST(path);

		if (!response.ok) {
			const error = await response.json();
			throw new Error(`GitHub API error: ${response.status} - ${error.message}`);
		}

		const data = (await response.json()) as GitHubContent | GitHubContent[];
		const contents = Array.isArray(data) ? data : [data];

		// Filter for markdown files or directories to recursively check
		const filteredContents = contents.filter(
			(item) =>
				(item.type === 'file' && (item.name.endsWith('.md') || item.name.endsWith('.svx'))) ||
				item.type === 'dir'
		);

		// Save to cache
		contentCache.set(path, {
			data: filteredContents,
			timestamp: Date.now()
		});

		return filteredContents;
	} catch (error) {
		console.error('Error listing markdown files:', error);
		throw error;
	}
}

/**
 * Get a single markdown file content
 */
export async function getMarkdownFile(path: string): Promise<GitHubFile> {
	// Check cache first
	if (isCacheValid(fileCache, path)) {
		console.log(`[GitHub] Using cached file content for ${path}`);
		return fileCache.get(path)!.data;
	}

	try {
		console.log(`[GitHub] Fetching file content for ${path}`);
		const response = await fetchFromGitHubREST(path);

		if (!response.ok) {
			const error = await response.json();
			throw new Error(`GitHub API error: ${response.status} - ${error.message}`);
		}

		const data = (await response.json()) as GitHubContent;

		if (!data.content) {
			throw new Error(`File content is empty: ${path}`);
		}

		// GitHub returns content as base64
		const content = Buffer.from(data.content, 'base64').toString('utf-8');

		// Extract slug from path (last part of the path without extension)
		const pathParts = path.split('/');
		const filename = pathParts[pathParts.length - 1];
		const slug = filename.replace(/\.(md|svx)$/, '');

		// Extract frontmatter from content
		const frontmatter = extractFrontmatter(content);

		const result = {
			content,
			path,
			slug,
			frontmatter
		};

		// Save to cache
		fileCache.set(path, {
			data: result,
			timestamp: Date.now()
		});

		return result;
	} catch (error) {
		console.error(`Error fetching markdown file ${path}:`, error);
		throw error;
	}
}

/**
 * List all markdown files in a directory and fetch their content
 * with optimized parallel processing
 */
export async function getAllMarkdownContent(
	path: string = env.GITHUB_CONTENT_PATH
): Promise<GitHubFile[]> {
	// Check cache first
	if (isCacheValid(dirContentCache, path)) {
		console.log(`[GitHub] Using cached content collection for ${path}`);
		return dirContentCache.get(path)!.data;
	}

	console.log(`[GitHub] Building content collection for ${path}`);
	const files: GitHubFile[] = [];
	const contents = await listMarkdownFiles(path);

	// Prepare tasks for parallel processing
	const processItem = async (item: GitHubContent) => {
		if (item.type === 'file') {
			try {
				const file = await getMarkdownFile(item.path);
				files.push(file);
			} catch (error) {
				console.error(`Error processing ${item.path}:`, error);
			}
		} else if (item.type === 'dir') {
			try {
				// Recursively get files from subdirectories
				const subFiles = await getAllMarkdownContent(item.path);
				files.push(...subFiles);
			} catch (error) {
				console.error(`Error processing directory ${item.path}:`, error);
			}
		}
	};

	// Process in batches of 5 to avoid overwhelming the GitHub API
	const BATCH_SIZE = 5;
	for (let i = 0; i < contents.length; i += BATCH_SIZE) {
		const batch = contents.slice(i, i + BATCH_SIZE);
		const batchPromises = batch.map(processItem);

		// Wait for this batch to complete before starting the next
		await Promise.all(batchPromises);
	}

	// Save to cache
	dirContentCache.set(path, {
		data: files,
		timestamp: Date.now()
	});

	return files;
}

/**
 * Extract frontmatter from markdown content using gray-matter
 */
function extractFrontmatter(content: string): GitHubFile['frontmatter'] {
	try {
		// Use gray-matter to parse the frontmatter
		const { data } = matter(content);
		return {
			...data,
			path: data.path || '', // Ensure path is always set
			title: data.title,
			date: data.date,
			category: data.category,
			tags: data.tags,
			excerpt: data.excerpt,
			published: data.published
		};
	} catch (error) {
		console.error('Error extracting frontmatter with gray-matter:', error);
		return {
			path: '', // Provide default path
			title: '',
			date: '',
			category: '',
			tags: [],
			excerpt: '',
			published: false
		};
	}
}

/**
 * Invalidate caches - useful for admin functions or webhook triggers
 */
export function invalidateGitHubCache(specificPath?: string): void {
	if (specificPath) {
		contentCache.delete(specificPath);
		fileCache.delete(specificPath);
		dirContentCache.delete(specificPath);
		console.log(`[GitHub] Cache invalidated for path: ${specificPath}`);
	} else {
		contentCache.clear();
		fileCache.clear();
		dirContentCache.clear();
		console.log('[GitHub] All GitHub caches invalidated');
	}
}

// Helper to process markdown entries
export function processMarkdownEntries(
	entries: GitHubContent[],
	path: string,
	isDev: boolean
): GitHubFile[] {
	return entries
		.map((entry): GitHubFile | null => {
			if (!entry.content) return null;

			const content = Buffer.from(entry.content, 'base64').toString('utf-8');
			const { data: frontmatter, content: parsedContent } = matter(content);

			// Skip unpublished entries in production
			if (!isDev && !frontmatter.published) {
				return null;
			}

			// Extract slug from path (last part of the path without extension)
			const pathParts = entry.path.split('/');
			const filename = pathParts[pathParts.length - 1];
			const slug = filename.replace(/\.(md|svx)$/, '');

			const processedFile: GitHubFile = {
				content: parsedContent,
				path: entry.path,
				slug,
				frontmatter: {
					...frontmatter,
					path,
					excerpt: frontmatter.excerpt || generateExcerpt(parsedContent)
				}
			};

			return processedFile;
		})
		.filter((entry): entry is GitHubFile => entry !== null);
}

// Helper to handle GitHub API retries
export async function fetchWithRetry(
	path: string,
	maxRetries = 3,
	baseDelay = 2000
): Promise<GitHubContent[]> {
	let retries = maxRetries;
	let delay = baseDelay;

	while (retries > 0) {
		try {
			const response = await fetchFromGitHubREST(path);
			if (!response.ok) {
				throw new Error(`GitHub API error: ${response.status}`);
			}
			const data = (await response.json()) as GitHubContent | GitHubContent[];
			return Array.isArray(data) ? data : [data];
		} catch (error) {
			retries--;
			if (retries === 0) throw error;

			if (error instanceof Error) {
				// Handle rate limiting
				if (error.message.includes('rate limit')) {
					await new Promise((resolve) => setTimeout(resolve, delay));
					delay *= 2; // Exponential backoff
					continue;
				}

				// Handle other GitHub API errors
				if (error.message.includes('GraphQL')) {
					throw new Error(`GitHub API error for path ${path}: ${error.message}`);
				}
			}

			// Handle unknown errors
			throw new Error(
				`Failed to fetch content from GitHub for path ${path}: ${
					error instanceof Error ? error.message : 'Unknown error'
				}`
			);
		}
	}
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

// Export a function to get all content
export async function getAllContent(type = ''): Promise<GitHubFile[]> {
	try {
		// Check cache first
		if (isCacheValid(dirContentCache, type)) {
			return dirContentCache.get(type)!.data;
		}

		const response = await fetchFromGitHubREST(type);
		if (!response.ok) {
			throw new Error('Failed to fetch content');
		}

		const entries = (await response.json()) as GitHubContent[];
		const isDev = import.meta.env.DEV;

		if (!entries || entries.length === 0) {
			console.warn(`No entries returned for path: ${type}`);
			return [];
		}

		const processedEntries = processMarkdownEntries(entries, type, isDev);

		// Update cache with proper structure
		dirContentCache.set(type, {
			data: processedEntries,
			timestamp: Date.now()
		});

		return processedEntries;
	} catch (error) {
		console.error(
			`Error loading content for ${type}:`,
			error instanceof Error ? error.message : 'Unknown error'
		);
		return [];
	}
}

// Get content folders
export async function getContentFolders(): Promise<string[]> {
	try {
		// Check if we've already cached the folders
		if (isCacheValid(folderCache, 'folders')) {
			return folderCache.get('folders')!.data;
		}

		const response = await fetchFromGitHubREST('');

		if (!response.ok) {
			throw new Error('Failed to fetch content folders');
		}

		const entries = (await response.json()) as GitHubContent[];
		if (!entries || entries.length === 0) {
			return [];
		}

		// Get folder names from entries
		const folders = entries.map((entry) => entry.name);

		// Cache the result
		folderCache.set('folders', {
			data: folders,
			timestamp: Date.now()
		});

		return folders;
	} catch (error) {
		console.error('Error fetching content folders:', error);
		return [];
	}
}

// Get content by slug
export async function getContentBySlug(type: string, slug: string): Promise<GitHubFile | null> {
	try {
		const entries = await getAllContent(type);
		if (!entries || !Array.isArray(entries)) {
			return null;
		}
		return entries.find((entry) => entry.frontmatter.slug === slug) || null;
	} catch (error) {
		console.error(`Error fetching content ${slug} in ${type}:`, error);
		return null;
	}
}

// Helper to fetch content from GitHub using GraphQL API
export async function fetchFromGitHubGraphQL(
	path = ''
): Promise<Array<{ id: string; markdown: string }>> {
	const githubToken = import.meta.env.VITE_GITHUB_TOKEN;

	if (!githubToken) {
		throw new Error('GitHub token is not configured in environment variables');
	}

	const expression = `HEAD:content/${path}`;

	// Test token with a simpler API call first
	try {
		const testResponse = await fetch('https://api.github.com/user', {
			headers: {
				Authorization: `bearer ${githubToken}`,
				Accept: 'application/vnd.github.v3+json'
			}
		});

		if (!testResponse.ok) {
			const testError = await testResponse.text();
			console.error('Token validation failed:', testError);
			throw new Error('Token validation failed');
		}
	} catch (error) {
		console.error('Token validation error:', error);
		throw error;
	}

	// First, try to verify repository access
	const repoQuery = `
		query verifyRepo {
			repository(owner: "iammatthias", name: "obsidian_cms") {
				id
				visibility
				defaultBranchRef {
					name
				}
			}
		}
	`;

	try {
		// First verify repository access
		const repoResponse = await fetch('https://api.github.com/graphql', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `bearer ${githubToken}`
			},
			body: JSON.stringify({ query: repoQuery })
		});

		const repoResult = await repoResponse.json();

		if (repoResult.errors) {
			console.error('Repository access error:', repoResult.errors);
			throw new Error('Cannot access repository. Check token permissions.');
		}

		// If repository is accessible, proceed with content fetch
		const query = `
			query fetchEntries($owner: String!, $name: String!, $expression: String!) {
				repository(owner: $owner, name: $name) {
					object(expression: $expression) {
						... on Tree {
							entries {
								name
								object {
									... on Blob {
										text
									}
								}
							}
						}
						... on Blob {
							text
						}
					}
				}
			}
		`;

		const variables = {
			owner: 'iammatthias',
			name: 'obsidian_cms',
			expression
		};

		const response = await fetch('https://api.github.com/graphql', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `bearer ${githubToken}`
			},
			body: JSON.stringify({ query, variables })
		});

		if (!response.ok) {
			const errorText = await response.text();
			console.error(`GitHub API HTTP error: ${response.status} ${errorText}`);
			throw new Error(`GitHub API request failed: ${response.status}`);
		}

		const result = await response.json();

		if (result.errors) {
			console.error('GraphQL Errors:', result.errors);
			throw new Error(`GraphQL Error: ${JSON.stringify(result.errors)}`);
		}

		if (!result.data?.repository) {
			console.error('No repository data found:', result);
			throw new Error('Repository not found or not accessible');
		}

		// Handle both Tree and Blob responses
		if (result.data.repository.object?.entries?.length) {
			const entries = result.data.repository.object.entries
				.filter((entry: { object?: { text?: string } }) => entry.object?.text)
				.map((entry: { name: string; object: { text: string } }) => ({
					id: entry.name,
					markdown: entry.object.text
				}));

			return entries;
		} else if (result.data.repository.object?.text) {
			return [
				{
					id: path.split('/').pop() || path,
					markdown: result.data.repository.object.text
				}
			];
		}

		console.error('Unexpected response structure:', result.data);
		throw new Error(`No valid data returned from GitHub for path: ${path}`);
	} catch (error) {
		if (error instanceof Error) {
			console.error(`GitHub fetch error for path ${path}:`, error);
			throw error;
		}
		throw new Error('An unknown error occurred while fetching from GitHub');
	}
}
