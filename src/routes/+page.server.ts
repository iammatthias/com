import { dev } from '$app/environment';
import type { PageServerLoad } from './$types';
import { getStore } from '$lib/store/content-store';

export const load: PageServerLoad = async ({ fetch, parent }) => {
	try {
		// Get parent data (which now includes routes from the store via layout load)
		const parentData = await parent();

		// Get the rest of the data from the store
		const store = await getStore(fetch);

		// Prepare the contentMap for the page props
		// The store's contentMap is a Map, convert it to a plain object for serialization
		const contentMapForProps: Record<string, any[]> = {};
		store.contentMap.forEach((value, key) => {
			// Slice only the latest 5 items for the homepage preview
			contentMapForProps[key] = value.slice(0, 5);
		});

		return {
			...parentData, // Includes routes
			contentTypes: store.contentTypes,
			contentMap: contentMapForProps, // Pass the processed map
			isDev: dev,
			lastUpdated: store.lastUpdated.toISOString() // Pass last updated time
		};
	} catch (error) {
		console.error('Error in page load fetching from store:', error);
		// Attempt to get parent data even if store fails, to render layout
		let parentDataFallback = {};
		try {
			parentDataFallback = await parent();
		} catch (parentError) {
			console.error('Error fetching parent data in fallback:', parentError);
		}
		return {
			...parentDataFallback,
			contentTypes: [],
			contentMap: {},
			isDev: dev,
			lastUpdated: new Date().toISOString(),
			error: 'Failed to load content. Please try again later.'
		};
	}
};
