import type { PageServerLoad } from './$types';
import { dev } from '$app/environment';

export const load: PageServerLoad = async ({ fetch, parent }) => {
	// Get parent data which contains routes
	const parentData = await parent();

	try {
		// Basic content types - simplified approach
		// For dev page, we're just listing content types without validating
		let contentTypes: string[] = [];

		// In development mode, try to fetch content folders
		if (dev) {
			try {
				const response = await fetch('/api/github?operation=getFolders');
				if (response.ok) {
					const data = await response.json();
					if (data?.repository?.object?.entries) {
						contentTypes = data.repository.object.entries
							.filter((entry: any) => entry.type === 'tree')
							.map((entry: any) => entry.name);
					}
				}
			} catch (error) {
				console.error('Error fetching content folders for dev page:', error);
			}
		}

		return {
			...parentData,
			contentTypes
		};
	} catch (error) {
		console.error('Error in dev page load:', error);
		return {
			...parentData,
			contentTypes: []
		};
	}
};
