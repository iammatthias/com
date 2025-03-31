import { env } from '$env/dynamic/private';
import matter from 'gray-matter';
import type { ContentItem } from '$lib/types/content';

export interface GitHubContentItem {
	title: string;
	slug: string;
	date: string;
	content: string;
	metadata?: {
		updated?: string;
		published?: boolean;
		category?: string;
		tags?: string | string[];
		path?: string;
		image?: string;
		imageCredit?: string;
	};
}

// Helper to fetch content from GitHub using their API
export async function fetchFromGitHub(path = '') {
	const githubToken = env.GITHUB_TOKEN;

	if (!githubToken) {
		console.error('GitHub token is missing. Please check your environment variables.');
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
			console.error('GitHub token validation failed:', {
				status: testResponse.status,
				error: testError
			});
			throw new Error(`GitHub token validation failed: ${testResponse.status} ${testError}`);
		}
	} catch (error) {
		console.error('GitHub token validation error:', error);
		throw new Error(
			`GitHub token validation error: ${error instanceof Error ? error.message : 'Unknown error'}`
		);
	}

	// First, try to verify repository access
	const repoQuery = `
    query verifyRepo {
      repository(owner: "${env.GITHUB_REPO_OWNER}", name: "${env.GITHUB_REPO_NAME}") {
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
			console.error('GitHub repository access error:', {
				errors: repoResult.errors,
				path
			});
			throw new Error(
				`Cannot access repository: ${repoResult.errors[0]?.message || 'Unknown error'}`
			);
		}

		if (!repoResult.data?.repository) {
			console.error('GitHub repository not found:', {
				result: repoResult,
				path
			});
			throw new Error('Repository not found or not accessible');
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
			owner: env.GITHUB_REPO_OWNER,
			name: env.GITHUB_REPO_NAME,
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
			console.error('GitHub API error:', {
				status: response.status,
				error: errorText,
				path
			});
			throw new Error(`GitHub API request failed: ${response.status} - ${errorText}`);
		}

		const result = await response.json();

		if (result.errors) {
			console.error('GitHub GraphQL errors:', {
				errors: result.errors,
				path
			});
			throw new Error(
				`GraphQL Error: ${result.errors[0]?.message || JSON.stringify(result.errors)}`
			);
		}

		if (!result.data?.repository) {
			console.error('GitHub repository data missing:', {
				result,
				path
			});
			throw new Error('Repository data not found or not accessible');
		}

		// Handle both Tree and Blob responses
		if (result.data.repository.object?.entries?.length) {
			const entries = result.data.repository.object.entries
				.filter((entry: any) => entry.object?.text)
				.map((entry: any) => ({
					id: entry.name,
					markdown: entry.object.text
				}));

			if (entries.length === 0) {
				console.warn('No markdown entries found:', {
					path,
					totalEntries: result.data.repository.object.entries.length
				});
			}

			return entries;
		} else if (result.data.repository.object?.text) {
			return [
				{
					id: path.split('/').pop() || path,
					markdown: result.data.repository.object.text
				}
			];
		}

		console.error('Unexpected GitHub response structure:', {
			data: result.data,
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

export async function processMarkdownEntries(
	entries: { id: string; markdown: string }[],
	path: string,
	isDev: boolean
): Promise<ContentItem[]> {
	const validEntries: ContentItem[] = [];

	for (const entry of entries) {
		try {
			const { data, content } = matter(entry.markdown);
			if (!data.title || !data.slug) {
				console.warn(`Skipping entry ${entry.id}: missing required fields`);
				continue;
			}

			const item: ContentItem = {
				title: data.title,
				slug: data.slug,
				date: data.created || data.date || new Date().toISOString(),
				content,
				metadata: {
					updated: data.updated,
					published: data.published,
					category: data.category,
					tags: data.tags,
					path: `${path}/${entry.id}`.replace(/\.md$/, ''),
					image: data.image,
					imageCredit: data.imageCredit
				}
			};

			// In production, filter out unpublished items
			if (!isDev && item.metadata?.published === false) {
				continue;
			}

			validEntries.push(item);
		} catch (error) {
			console.error(`Error processing markdown for ${entry.id}:`, error);
		}
	}

	return validEntries;
}

export async function fetchWithRetry(
	path: string,
	maxRetries = 3,
	baseDelay = 2000
): Promise<any[]> {
	let lastError;
	for (let attempt = 1; attempt <= maxRetries; attempt++) {
		try {
			return await fetchFromGitHub(path);
		} catch (error) {
			lastError = error;
			if (attempt === maxRetries) break;

			// Calculate exponential backoff delay
			const delay = baseDelay * Math.pow(2, attempt - 1);
			console.warn(`Attempt ${attempt} failed for path ${path}. Retrying in ${delay}ms...`, error);
			await new Promise((resolve) => setTimeout(resolve, delay));
		}
	}
	throw lastError;
}

export async function getContentByType(type: string): Promise<ContentItem[]> {
	const isDev = process.env.NODE_ENV === 'development';
	try {
		const entries = await fetchWithRetry(type);
		return await processMarkdownEntries(entries, type, isDev);
	} catch (error) {
		console.error(`Failed to load content for type ${type}:`, error);
		throw error;
	}
}

export async function getContentItem(type: string, slug: string): Promise<ContentItem | null> {
	const items = await getContentByType(type);
	return items.find((item) => item.slug === slug) || null;
}

export async function getAllTags(): Promise<Record<string, ContentItem[]>> {
	const isDev = process.env.NODE_ENV === 'development';
	const contentFolders = await getContentFolders();
	const allContent: ContentItem[] = [];

	for (const folder of contentFolders) {
		try {
			const content = await getContentByType(folder);
			allContent.push(...content);
		} catch (error) {
			console.error(`Error loading content from ${folder}:`, error);
		}
	}

	const tagMap: Record<string, ContentItem[]> = {};

	allContent.forEach((item) => {
		const tags = Array.isArray(item.metadata?.tags) ? item.metadata?.tags : [item.metadata?.tags];

		tags.forEach((tag) => {
			if (!tag) return;
			if (!tagMap[tag]) {
				tagMap[tag] = [];
			}
			tagMap[tag].push(item);
		});
	});

	return tagMap;
}

export async function getContentFolders(): Promise<string[]> {
	try {
		const entries = await fetchWithRetry('');
		return entries
			.filter((entry) => entry.id.endsWith('.md'))
			.map((entry) => entry.id.replace(/\.md$/, ''));
	} catch (error) {
		console.error('Error fetching content folders:', error);
		throw error;
	}
}

export async function fetchGlassFeed(): Promise<any[]> {
	const githubToken = env.GITHUB_TOKEN;

	if (!githubToken) {
		console.error('GitHub token is missing. Please check your environment variables.');
		throw new Error('GitHub token is not configured in environment variables');
	}

	const query = `
    query {
      repository(owner: "iammatthias", name: "obsidian_cms") {
        object(expression: "HEAD:content/glass.json") {
          ... on Blob {
            text
          }
        }
      }
    }
  `;

	try {
		const response = await fetch('https://api.github.com/graphql', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `bearer ${githubToken}`
			},
			body: JSON.stringify({ query })
		});

		if (!response.ok) {
			throw new Error(`GitHub API request failed: ${response.status}`);
		}

		const result = await response.json();

		if (result.errors) {
			throw new Error(`GraphQL Error: ${result.errors[0]?.message}`);
		}

		const jsonText = result.data?.repository?.object?.text;
		if (!jsonText) {
			throw new Error('Glass feed data not found');
		}

		return JSON.parse(jsonText);
	} catch (error) {
		console.error('Error fetching Glass feed:', error);
		throw error;
	}
}
