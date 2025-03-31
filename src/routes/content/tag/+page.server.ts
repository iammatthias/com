import type { PageServerLoad } from './$types';
import type { ContentItem } from '$lib/types';
import { getContentByType, getContentTypes } from '$lib/services/content';

export const load: PageServerLoad = async ({ fetch }) => {
	try {
		// Get all content types
		const contentTypes = await getContentTypes(fetch);
		const tagMap = new Map<string, number>();

		// Collect all tags and their counts
		for (const type of contentTypes) {
			const items = await getContentByType(type, fetch);
			items.forEach((item: ContentItem) => {
				if (item.metadata?.tags) {
					const tags = Array.isArray(item.metadata.tags)
						? item.metadata.tags
						: [item.metadata.tags];
					tags.forEach((tag: string) => {
						tagMap.set(tag, (tagMap.get(tag) || 0) + 1);
					});
				}
			});
		}

		// Convert to sorted array and counts object
		const tags = Array.from(tagMap.keys()).sort();
		const tagCounts = Object.fromEntries(tagMap);

		return {
			tags,
			tagCounts
		};
	} catch (error) {
		console.error('Error loading tags:', error);
		return {
			tags: [],
			tagCounts: {},
			error: 'Failed to load tags'
		};
	}
};
