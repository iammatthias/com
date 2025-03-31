import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

/**
 * Test endpoint to verify GitHub API connection
 * This is only for development purposes
 */
export const GET: RequestHandler = async () => {
	try {
		// Check environment variables
		const token = env.GITHUB_TOKEN;
		const owner = env.GITHUB_REPO_OWNER;
		const repo = env.GITHUB_REPO_NAME;
		const contentPath = env.GITHUB_CONTENT_PATH;

		// Check for missing configuration
		const missingVars = [];
		if (!token) missingVars.push('GITHUB_TOKEN');
		if (!owner) missingVars.push('GITHUB_REPO_OWNER');
		if (!repo) missingVars.push('GITHUB_REPO_NAME');
		if (!contentPath) missingVars.push('GITHUB_CONTENT_PATH');

		if (missingVars.length > 0) {
			return json(
				{
					success: false,
					message: 'GitHub API configuration incomplete',
					missing: missingVars,
					config: {
						owner: owner || '(missing)',
						repo: repo || '(missing)',
						contentPath: contentPath || '(missing)',
						token: token
							? `${token.substring(0, 5)}...${token.substring(token.length - 4)}`
							: '(missing)'
					}
				},
				{ status: 400 }
			);
		}

		// Try a direct GitHub API call
		const response = await fetch(
			`https://api.github.com/repos/${owner}/${repo}/contents/${contentPath}`,
			{
				headers: {
					Authorization: `token ${token}`,
					Accept: 'application/vnd.github.v3+json',
					'User-Agent': 'SvelteKit-CMS'
				}
			}
		);

		const responseBody = await response.json();

		// Return GitHub API response
		return json({
			success: response.ok,
			message: response.ok ? 'GitHub API connection successful' : 'GitHub API request failed',
			statusCode: response.status,
			statusText: response.statusText,
			githubResponse: responseBody,
			config: {
				owner,
				repo,
				contentPath,
				token: token
					? `${token.substring(0, 5)}...${token.substring(token.length - 4)}`
					: '(missing)'
			}
		});
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : 'Unknown error';
		console.error('GitHub API test failed:', errorMessage);

		return json(
			{
				success: false,
				message: 'GitHub API connection failed',
				error: errorMessage,
				environment: process.env.NODE_ENV || 'unknown'
			},
			{ status: 500 }
		);
	}
};
