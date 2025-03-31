import { error } from '@sveltejs/kit';
import {
	getContentByType,
	getContentFolders,
	filterPublishedContent,
	type ContentItem
} from '$lib/services/content';
import type { PageServerLoad } from './$types';

// Enable Incremental Static Regeneration
export const config = {
	isr: {
		expiration: 60 * 60 // Cache for 1 hour
	}
};

// Prerender valid content types
export const prerender = true;

// Generate pages for all valid content types
export const entries = async () => {
	try {
		const contentTypes = await getContentFolders();
		return contentTypes.map((type) => ({ type }));
	} catch (error) {
		console.error('Error generating entries:', error);
		return [];
	}
};

export const load: PageServerLoad = async ({ params, fetch }) => {
	try {
		// Get all content for this type, passing the fetch function
		const content = await getContentByType(params.type, fetch);

		// Filter for published content (assuming isDev check based on environment)
		// Note: process.env.NODE_ENV might not be reliable here, consider using $app/environment's dev
		const isDev = process.env.NODE_ENV !== 'production'; // Example check, use $app/environment if preferred
		const filteredContent = filterPublishedContent(content, isDev);

		if (filteredContent.length === 0) {
			throw error(404, `No published content found for ${params.type}`);
		}

		return {
			items: filteredContent,
			contentType: params.type
		};
	} catch (err) {
		console.error(`Error loading ${params.type}:`, err);
		// Re-throw specific SvelteKit errors (like 404)
		if (err && typeof err === 'object' && 'status' in err) {
			throw err;
		}
		// Throw a 500 for other unexpected errors
		throw error(500, `Could not load ${params.type}`);
	}
};
