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
		const path = url.searchParams.get('path');
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
			const cleanPath = path?.replace(/^\/+|\/+$/g, '') || '';
			// const contentPathBase = env.GITHUB_CONTENT_PATH || 'content'; // Removed - base path is already included in cleanPath
			// Construct the expression directly from the provided path
			const fullPathExpression = `HEAD:${cleanPath}`;
			variables.expression = fullPathExpression; // Use expression consistently

			// Query to get entries, handling both Tree (for folder listing) and Blob (for file content)
			query = `
				query GetContentEntries($owner: String!, $repo: String!, $expression: String!) {
					repository(owner: $owner, name: $repo) {
						object(expression: $expression) {
							__typename # Get the type of the object
							... on Tree {
								entries {
									name
									type
									object {
										... on Blob {
											text
										}
									}
								}
							}
							... on Blob {
								text # Directly get text if expression points to a file
							}
						}
					}
				}
			`.trim();
			// Remove the unused 'path' variable specific to the old query structure
			// delete variables.path;
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

		// Check for errors in the GraphQL response payload
		if (data.errors && data.errors.length > 0) {
			console.error(
				`GraphQL errors for operation ${operation}:`,
				JSON.stringify(data.errors, null, 2)
			); // Pretty print errors
			console.error(`Query Variables leading to error:`, apiRequestBody.variables);
			console.error(`Query leading to error:\n${query}`);
			// Provide the first GraphQL error message to the client
			throw error(500, `GraphQL error: ${data.errors[0].message}. Check server logs for details.`);
		}

		// ---- TEMPORARY LOGGING ----
		if (operation === OPERATIONS.fetchEntries) {
			console.log(`[GitHub API Raw Response for ${path}] Data:`, JSON.stringify(data, null, 2));
		}
		// ---- END TEMPORARY LOGGING ----

		// Log successful response data structure (optional, can be verbose)
		// console.log(`[GitHub API Response] Operation: ${operation}, Data:`, JSON.stringify(data, null, 2));

		return json(data.data); // Return only the data part of the response
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
