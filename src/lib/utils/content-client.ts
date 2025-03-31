import { dev } from '$app/environment';
import type { ContentItem } from '$lib/types';

/**
 * Client-side safe content utilities that don't import server-side code
 */

/**
 * Filter content items to only include published ones (or all if in dev mode)
 */
export function filterPublishedContent(items: ContentItem[], isDev = dev): ContentItem[] {
	if (!items || !Array.isArray(items)) {
		return [];
	}

	return items.filter((item) => {
		// In dev mode, show all items
		if (isDev) {
			return true;
		}

		// In production, only show published items
		return item.metadata?.published !== false;
	});
}
