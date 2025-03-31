import { env } from '$env/dynamic/private';

/**
 * Server-side GitHub configuration validation
 */
export function validateGitHubConfig(): string[] {
	const errors: string[] = [];

	// Check required GitHub API environment variables
	if (!env.GITHUB_TOKEN) {
		errors.push('GITHUB_TOKEN is missing');
	}

	if (!env.GITHUB_REPO_OWNER) {
		errors.push('GITHUB_REPO_OWNER is missing');
	}

	if (!env.GITHUB_REPO_NAME) {
		errors.push('GITHUB_REPO_NAME is missing');
	}

	if (!env.GITHUB_CONTENT_PATH) {
		errors.push('GITHUB_CONTENT_PATH is missing');
	}

	return errors;
}

/**
 * Logs GitHub configuration validation errors
 */
export function logGitHubConfigErrors(): void {
	const errors = validateGitHubConfig();

	if (errors.length > 0) {
		console.error('GitHub Configuration Errors:');
		errors.forEach((error) => console.error(`- ${error}`));
		console.error('These must be fixed for the GitHub API integration to work properly.');
	} else {
		console.log('GitHub API configuration validated successfully.');
	}
}
