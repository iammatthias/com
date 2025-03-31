import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { invalidateGitHubCache } from '$lib/services/github';
import type { RequestHandler } from './$types';
import crypto from 'crypto';

/**
 * Webhook endpoint for GitHub to notify when content is updated
 * This allows for automatic cache invalidation on content changes
 *
 * In development mode:
 * - No webhook setup is needed
 * - The GET endpoint can be used to manually invalidate the cache
 *
 * In production:
 * 1. Configure a webhook in your GitHub repository settings
 * 2. Set the webhook URL to point to this endpoint
 * 3. Choose content events (push, create, delete)
 * 4. Set a secret token and add it to your .env as GITHUB_WEBHOOK_SECRET
 */

// Cache for tracking webhook calls to prevent duplicate processing
const webhookCache = new Map<string, number>();
const WEBHOOK_CACHE_DURATION = 60 * 1000; // 1 minute

function verifyGitHubSignature(payload: string, signature: string): boolean {
	if (!env.GITHUB_WEBHOOK_SECRET) {
		console.warn('GitHub webhook secret not configured');
		return false;
	}

	const hmac = crypto.createHmac('sha256', env.GITHUB_WEBHOOK_SECRET);
	const digest = 'sha256=' + hmac.update(payload).digest('hex');
	return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
}

export const POST: RequestHandler = async ({ request }) => {
	try {
		const payload = await request.text();
		const signature = request.headers.get('x-hub-signature-256');

		// Verify webhook signature in production
		if (!env.DEV && signature) {
			if (!verifyGitHubSignature(payload, signature)) {
				return json({ error: 'Invalid signature' }, { status: 403 });
			}
		}

		const event = request.headers.get('x-github-event');
		const deliveryId = request.headers.get('x-github-delivery');

		// Check for duplicate webhook calls
		if (deliveryId) {
			const lastProcessed = webhookCache.get(deliveryId);
			if (lastProcessed && Date.now() - lastProcessed < WEBHOOK_CACHE_DURATION) {
				return json({ message: 'Webhook already processed' }, { status: 200 });
			}
			webhookCache.set(deliveryId, Date.now());
		}

		// Process the webhook
		const data = JSON.parse(payload);
		let affectedPaths: string[] = [];

		// Extract affected paths based on the event type
		switch (event) {
			case 'push':
				affectedPaths =
					data.commits?.flatMap((commit: any) => [
						...(commit.added || []),
						...(commit.modified || []),
						...(commit.removed || [])
					]) || [];
				break;
			case 'create':
			case 'delete':
				if (data.ref_type === 'branch' && data.ref === 'main') {
					// Invalidate everything for main branch changes
					invalidateGitHubCache();
					if (global.sitemapCache) global.sitemapCache = null;
					return json({ message: 'Cache invalidated for branch change' });
				}
				break;
			default:
				return json({ message: 'Unhandled event type' }, { status: 200 });
		}

		// Invalidate cache for affected paths
		if (affectedPaths.length > 0) {
			// Filter for content-related paths
			const contentPaths = affectedPaths.filter((path) => path.startsWith('content/'));

			if (contentPaths.length > 0) {
				// Invalidate GitHub cache for each affected path
				for (const path of contentPaths) {
					invalidateGitHubCache(path);
				}

				// Invalidate sitemap cache since content changed
				if (global.sitemapCache) global.sitemapCache = null;

				return json({
					message: 'Cache invalidated for affected paths',
					paths: contentPaths
				});
			}
		}

		return json({ message: 'No content changes detected' });
	} catch (error) {
		console.error('Webhook processing error:', error);
		return json(
			{
				error: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		);
	}
};

// Add a GET handler for testing the webhook endpoint
export const GET: RequestHandler = async ({ url }) => {
	// Check if we should perform cache invalidation (development helper)
	const clearCache = url.searchParams.get('clear_cache') === 'true';

	if (clearCache) {
		// Allow specifying a specific path to invalidate
		const path = url.searchParams.get('path') || undefined;
		invalidateGitHubCache(path);

		// Also invalidate sitemap cache
		if (global.sitemapCache) global.sitemapCache = null;

		return json({
			success: true,
			message: path ? `Cache invalidated for path: ${path}` : 'All GitHub caches invalidated',
			mode: process.env.NODE_ENV || 'unknown'
		});
	}

	return json({
		success: true,
		message: 'GitHub webhook endpoint is active',
		instructions: 'For local development, append ?clear_cache=true to manually clear the cache',
		mode: process.env.NODE_ENV || 'unknown'
	});
};
