import { dev } from '$app/environment';
import type { PageServerLoad } from './$types';
import { getStore } from '$lib/store/content-store';

// Helper function to get the most recent date from a content array
function getMostRecentDate(content: any[]): Date {
	if (!content || content.length === 0) return new Date(0);
	return new Date(Math.max(...content.map((item) => new Date(item.date).getTime())));
}

export const load: PageServerLoad = async ({ fetch, parent }) => {
	try {
		// Get parent data (which now includes routes from the store via layout load)
		const parentData = await parent();

		// Get the rest of the data from the store
		const store = await getStore(fetch);

		// Create a map of content type to most recent date
		const contentTypeLastUpdated: Record<string, Date> = {};
		store.contentMap.forEach((value, key) => {
			contentTypeLastUpdated[key] = getMostRecentDate(value);
		});

		// Sort content types by their most recent content
		const sortedContentTypes = store.contentTypes
			.filter((type) => {
				const content = store.contentMap.get(type);
				return content && content.length > 0;
			})
			.sort((a, b) => contentTypeLastUpdated[b].getTime() - contentTypeLastUpdated[a].getTime());

		// Prepare the contentMap for the page props
		const contentMapForProps: Record<string, any[]> = {};
		store.contentMap.forEach((value, key) => {
			// Slice only the latest 5 items for the homepage preview
			contentMapForProps[key] = value.slice(0, 5);
		});

		return {
			...parentData, // Includes routes
			contentTypes: sortedContentTypes,
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
