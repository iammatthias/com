import { getStore, getContentForType } from '$lib/store/content-store';
import { dev } from '$app/environment';
import type { PageServerLoad } from './$types';
import type { ContentItem } from '$lib/types';
import { filterPublishedContent } from '$lib/utils/content-client';

export const load: PageServerLoad = async ({ fetch }) => {
	try {
		// Initialize or get the existing store
		const store = await getStore(fetch);

		// Get content types from the store
		const contentTypes = store.contentTypes;

		if (!contentTypes.length) {
			return {
				contentTypes: [],
				contentMap: {},
				error: 'No content types found in store.'
			};
		}

		// Prepare the content map for the page, filtering and limiting
		const pageContentMap: Record<string, ContentItem[]> = {};
		const contentTypeLastUpdated: Record<string, Date> = {};

		for (const type of contentTypes) {
			// Get items from the store's map
			const items = store.contentMap.get(type) || [];

			if (items.length > 0) {
				// Filter published content based on environment
				// Note: The store initialization might already handle this depending on its logic
				const filteredItems = filterPublishedContent(items);

				if (filteredItems.length > 0) {
					// Sort by date descending before slicing
					const sortedItems = filteredItems.sort(
						(a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
					);

					// Store up to 10 most recent items for this page
					pageContentMap[type] = sortedItems.slice(0, 10);

					// Store the most recent date for sorting types
					contentTypeLastUpdated[type] = new Date(sortedItems[0].date);
				}
			}
		}

		// Sort content types by their most recent content
		const sortedContentTypes = contentTypes
			.filter((type) => contentTypeLastUpdated[type]) // Filter types that ended up with no publishable content
			.sort((a, b) => {
				const dateA = contentTypeLastUpdated[a];
				const dateB = contentTypeLastUpdated[b];
				return dateB.getTime() - dateA.getTime();
			});

		return {
			contentTypes: sortedContentTypes,
			contentMap: pageContentMap, // Return the processed map for the page
			isDev: dev
		};
	} catch (error) {
		console.error('Failed to load content from store:', error);
		return {
			contentTypes: [],
			contentMap: {} as Record<string, ContentItem[]>,
			error: 'Failed to load content. Please try again later.'
		};
	}
};
