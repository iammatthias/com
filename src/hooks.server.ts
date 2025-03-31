import { env } from '$env/dynamic/private';
import { logGitHubConfigErrors, validateGitHubConfig } from '$lib/server/config-validator';
import { initializeStore } from '$lib/store/content-store';
import type { Handle } from '@sveltejs/kit';

// Run configuration validation on server startup
const configErrors = validateGitHubConfig();

// Log startup configuration status
if (configErrors.length > 0) {
	console.warn('GitHub API configuration is incomplete. Content fetching will not work correctly.');
	console.warn('Please check the following environment variables:');
	configErrors.forEach((error) => console.warn(`- ${error}`));

	// Still call the log function to output the details
	logGitHubConfigErrors();
} else {
	console.log('GitHub API configuration validated successfully.');

	// Log the configured repository
	console.log(`Configured to fetch content from: ${env.GITHUB_REPO_OWNER}/${env.GITHUB_REPO_NAME}`);
	console.log(`Content path: ${env.GITHUB_CONTENT_PATH}`);

	// Test the token format (without revealing it)
	if (env.GITHUB_TOKEN) {
		const tokenLength = env.GITHUB_TOKEN.length;
		const firstChars = env.GITHUB_TOKEN.substring(0, 4);
		console.log(`Token detected (${tokenLength} chars, starts with ${firstChars}...)`);
	}
}

// Track initialization status
let isInitializing = false;

export const handle: Handle = async ({ event, resolve }) => {
	// Initialize the content store in a non-blocking way
	if (!process.env.VITEST && !isInitializing) {
		isInitializing = true;

		// Start initialization in the background
		initializeStore(event.fetch)
			.then(() => {
				console.log('Content store initialized successfully');
				isInitializing = false;
			})
			.catch((err) => {
				console.error('Failed to initialize content store:', err);
				isInitializing = false;
			});
	}

	// Continue with the request without waiting for store initialization
	const response = await resolve(event);
	return response;
};

// Export hooks here if needed
