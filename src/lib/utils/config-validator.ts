import { env } from '$env/dynamic/public';

/**
 * Client-side configuration validation
 * Only handles public environment variables
 */
export function validateClientConfig(): string[] {
	const errors: string[] = [];

	// Add any public environment variable checks here
	// Example:
	// if (!env.PUBLIC_API_URL) {
	//   errors.push('PUBLIC_API_URL is missing');
	// }

	return errors;
}

/**
 * Logs client configuration validation errors
 */
export function logClientConfigErrors(): void {
	const errors = validateClientConfig();

	if (errors.length > 0) {
		console.warn('Client Configuration Warnings:');
		errors.forEach((error) => console.warn(`- ${error}`));
	}
}
