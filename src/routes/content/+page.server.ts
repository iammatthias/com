import { getStore } from '$lib/store/content-store';
import { dev } from '$app/environment';
import type { PageServerLoad } from './$types';

const ITEMS_PER_PAGE = 10;

export const load: PageServerLoad = async ({ fetch, url }) => {
	try {
		// Initialize or get the existing store
		const store = await getStore(fetch);
		const page = Number(url.searchParams.get('page')) || 1;

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
		const pageContentMap: Record<string, any[]> = {};
		const contentTypeLastUpdated: Record<string, Date> = {};
		const contentTypeTotals: Record<string, number> = {};

		for (const type of contentTypes) {
			// Get items from the store's map
			const items = store.contentMap.get(type) || [];

			if (items.length > 0) {
				// Sort by date descending before slicing
				const sortedItems = items.sort(
					(a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
				);

				// Store total count for pagination
				contentTypeTotals[type] = sortedItems.length;

				// Calculate pagination for this content type
				const startIndex = (page - 1) * ITEMS_PER_PAGE;
				const endIndex = startIndex + ITEMS_PER_PAGE;

				// Store paginated items
				pageContentMap[type] = sortedItems.slice(startIndex, endIndex);

				// Store the most recent date for sorting types
				contentTypeLastUpdated[type] = new Date(sortedItems[0].date);
			}
		}

		// Sort content types by most recently updated
		const sortedTypes = contentTypes.sort((a, b) => {
			const dateA = contentTypeLastUpdated[a] || new Date(0);
			const dateB = contentTypeLastUpdated[b] || new Date(0);
			return dateB.getTime() - dateA.getTime();
		});

		return {
			contentTypes: sortedTypes,
			contentMap: pageContentMap,
			pagination: {
				currentPage: page,
				totalPages: Math.max(
					...Object.values(contentTypeTotals).map((total) => Math.ceil(total / ITEMS_PER_PAGE))
				),
				totalItems: Object.values(contentTypeTotals).reduce((sum, total) => sum + total, 0),
				itemsPerPage: ITEMS_PER_PAGE
			},
			isDev: dev
		};
	} catch (error) {
		console.error('Error loading content:', error);
		return {
			contentTypes: [],
			contentMap: {},
			pagination: {
				currentPage: 1,
				totalPages: 1,
				totalItems: 0,
				itemsPerPage: ITEMS_PER_PAGE
			},
			error: 'Failed to load content. Please try again later.'
		};
	}
};
