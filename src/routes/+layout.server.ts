import type { LayoutServerLoad } from './$types';
import { getStore } from '$lib/store/content-store'; // Import the store
import type { RouteNode } from '$lib/utils/routes'; // Import RouteNode if not already present

// Default navigation (can be kept as a fallback)
const DEFAULT_ROUTES: RouteNode[] = [
	{ path: '/', label: 'Home' },
	{ path: '/bio', label: 'Bio' }
	// Remove default content route, let the store handle it
];

export const config = {
	isr: {
		expiration: 60 * 60 // Cache for 1 hour
	}
};

export const load: LayoutServerLoad = async ({ fetch }) => {
	try {
		const store = await getStore(fetch);
		return {
			routes: store.routes // Get routes directly from the store
		};
	} catch (error) {
		console.error('Layout load error fetching from store:', error);
		// Fallback to default routes if store fails
		return {
			routes: DEFAULT_ROUTES
		};
	}
};
