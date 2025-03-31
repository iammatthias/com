import { json } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { invalidateGitHubCache } from '$lib/services/github';
import type { RequestHandler } from './$types';

// Declare global cache type
declare global {
	var sitemapCache: {
		content: string;
		timestamp: number;
	} | null;
}

// Cache invalidation tracking
let lastInvalidation = 0;
const INVALIDATION_COOLDOWN = 60 * 1000; // 1 minute cooldown

export const GET: RequestHandler = async ({ url }) => {
	try {
		// Only allow revalidation in dev mode or with proper authorization
		if (!dev) {
			return json(
				{
					success: false,
					message: 'Revalidation is only available in development mode'
				},
				{ status: 403 }
			);
		}

		// Check cooldown to prevent abuse
		const now = Date.now();
		if (now - lastInvalidation < INVALIDATION_COOLDOWN) {
			const waitTime = Math.ceil((INVALIDATION_COOLDOWN - (now - lastInvalidation)) / 1000);
			return json(
				{
					success: false,
					message: `Please wait ${waitTime} seconds before revalidating again`
				},
				{ status: 429 }
			);
		}

		// Get specific path to invalidate (optional)
		const path = url.searchParams.get('path') || undefined;

		// Invalidate GitHub cache
		invalidateGitHubCache(path);

		// Invalidate sitemap cache
		if (global.sitemapCache) {
			global.sitemapCache = null;
		}

		// Update last invalidation timestamp
		lastInvalidation = now;

		return json({
			success: true,
			message: path ? `Cache invalidated for path: ${path}` : 'All caches invalidated successfully',
			timestamp: new Date().toISOString()
		});
	} catch (error) {
		console.error('Revalidation error:', error);
		return json(
			{
				success: false,
				message: error instanceof Error ? error.message : 'Unknown error occurred'
			},
			{ status: 500 }
		);
	}
};
