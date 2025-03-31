import { env } from '$env/dynamic/private';
import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// Operations supported by this endpoint
const OPERATIONS = {
	getFolders: 'getFolders',
	fetchEntries: 'fetchEntries'
};

export const GET: RequestHandler = async ({ url, fetch }) => {
	try {
		// Get the operation from the query string
		const operation = url.searchParams.get('operation');
		const path = url.searchParams.get('path');
		const cleanPath = path?.replace(/^\/+|\/+$/g, '') || '';

		// Check if GitHub token is configured
		const token = env.GITHUB_TOKEN;
		if (!token) {
			console.error('GitHub token not configured');
			throw error(500, 'GitHub API token not configured');
		}

		// Validate the operation
		if (!operation || !Object.values(OPERATIONS).includes(operation)) {
			throw error(400, 'Invalid or missing operation');
		}

		// For fetchEntries, path is required
		if (operation === OPERATIONS.fetchEntries && !path) {
			throw error(400, 'Path is required for fetchEntries operation');
		}

		// Set up GraphQL query based on operation
		let query = '';
		let variables: Record<string, any> = {
			// Allow any type for variables
			owner: env.GITHUB_REPO_OWNER || '',
			repo: env.GITHUB_REPO_NAME || '',
			token: token // Add token for logging, DO NOT SEND TO GITHUB in query body
		};

		// Configure the proper query based on operation
		if (operation === OPERATIONS.getFolders) {
			const contentPath = env.GITHUB_CONTENT_PATH || 'content';
			const expression = `HEAD:${contentPath}`;
			variables.expression = expression; // Add expression to variables

			// Simplified query focusing on getting directory entries
			query = `
				query GetContentFolders($owner: String!, $repo: String!, $expression: String!) {
					repository(owner: $owner, name: $repo) {
						object(expression: $expression) {
							... on Tree {
								entries {
									name
									type # Keep type to filter for 'tree' later if needed
								}
							}
						}
					}
				}
			`.trim();
		} else if (operation === OPERATIONS.fetchEntries) {
			const fullPathExpression = `HEAD:${cleanPath}`;
			variables.expression = fullPathExpression;

			// Updated query to better handle both directory listings and file contents
			query = `
				query GetContentEntries($owner: String!, $repo: String!, $expression: String!) {
					repository(owner: $owner, name: $repo) {
						object(expression: $expression) {
							__typename
							... on Tree {
								entries {
									name
									type
									object {
										... on Blob {
											text
											byteSize
										}
									}
								}
							}
							... on Blob {
								text
								byteSize
							}
						}
					}
				}
			`.trim();
		}

		// Log the request details (excluding sensitive token from query body itself)
		console.log(`[GitHub API Request] Operation: ${operation}`);
		console.log(`[GitHub API Request] Variables:`, {
			owner: variables.owner,
			repo: variables.repo,
			expression: variables.expression
		});
		// console.log(`[GitHub API Request] Query:\n${query}`); // Uncomment for verbose query logging if needed

		// Make the GraphQL request to GitHub API
		const apiRequestBody = {
			query,
			variables: {
				// Only pass necessary variables to GitHub
				owner: variables.owner,
				repo: variables.repo,
				expression: variables.expression
			}
		};

		const response = await fetch('https://api.github.com/graphql', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}` // Use the original token here
			},
			body: JSON.stringify(apiRequestBody) // Send the refined request body
		});

		// Check for API errors
		if (!response.ok) {
			const errorText = await response.text();
			// Log the detailed error response from GitHub
			console.error(
				`GitHub API HTTP error (${response.status}) for operation ${operation}:`,
				errorText
			);
			console.error(`Failed Query Variables:`, apiRequestBody.variables); // Log variables used in failed query
			console.error(`Failed Query:\n${query}`); // Log the exact query that failed
			throw error(
				response.status,
				`GitHub API error: ${response.statusText}. Check server logs for details.`
			); // More informative error
		}

		// Parse and return the data
		const data = await response.json();

		// Log the raw response for debugging
		console.log(`[GitHub API Raw Response for ${path}] Data:`, JSON.stringify(data, null, 2));

		// Check for errors in the GraphQL response payload
		if (data.errors && data.errors.length > 0) {
			console.error(
				`GraphQL errors for operation ${operation}:`,
				JSON.stringify(data.errors, null, 2)
			);
			console.error(`Query Variables leading to error:`, apiRequestBody.variables);
			console.error(`Query leading to error:\n${query}`);
			throw error(500, `GraphQL error: ${data.errors[0].message}. Check server logs for details.`);
		}

		// Return the data with additional context
		return json({
			success: true,
			data: data.data,
			operation,
			path: cleanPath || 'root'
		});
	} catch (err) {
		// Handle SvelteKit errors
		if (err instanceof Error && 'status' in err) {
			throw err;
		}

		// Handle other errors
		console.error('Unhandled error in GitHub API endpoint:', err);
		throw error(500, 'Failed to fetch data from GitHub');
	}
};
