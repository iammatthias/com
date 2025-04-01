import { error } from '@sveltejs/kit';
import { getStore } from '$lib/store/content-store';
import { dev } from '$app/environment';
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
		const contentTypes = ['blog', 'projects', 'notes']; // Hardcode valid content types
		return contentTypes.map((type) => ({ type }));
	} catch (error) {
		console.error('Error generating entries:', error);
		return [];
	}
};

const ITEMS_PER_PAGE = 10;

export const load: PageServerLoad = async ({ params, fetch, url }) => {
	const contentType = params.type;
	const page = Number(url.searchParams.get('page')) || 1;

	try {
		const store = await getStore(fetch);
		const allItems = store.contentMap.get(contentType) || [];

		// Calculate pagination
		const totalItems = allItems.length;
		const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
		const currentPage = Math.max(1, Math.min(page, totalPages));
		const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
		const endIndex = startIndex + ITEMS_PER_PAGE;

		// Get items for current page
		const items = allItems.slice(startIndex, endIndex);

		// Calculate metadata
		const categories = new Set<string>();
		const tags = new Set<string>();
		let lastPublished = '';
		let lastUpdated = '';

		allItems.forEach((item) => {
			if (item.metadata?.category) {
				categories.add(item.metadata.category);
			}
			if (item.metadata?.tags) {
				const itemTags = Array.isArray(item.metadata.tags)
					? item.metadata.tags
					: [item.metadata.tags];
				itemTags.forEach((tag) => tags.add(tag));
			}
			if (item.date && (!lastPublished || item.date > lastPublished)) {
				lastPublished = item.date;
			}
			if (item.metadata?.updated && (!lastUpdated || item.metadata.updated > lastUpdated)) {
				lastUpdated = item.metadata.updated;
			}
		});

		return {
			items,
			contentType,
			isDev: dev,
			pagination: {
				currentPage,
				totalPages,
				totalItems,
				itemsPerPage: ITEMS_PER_PAGE
			},
			metadata: {
				totalEntries: allItems.length,
				categories: Array.from(categories),
				tags: Array.from(tags),
				lastPublished: lastPublished || new Date().toISOString(),
				lastUpdated: lastUpdated || lastPublished || new Date().toISOString()
			}
		};
	} catch (error) {
		console.error(`Error loading content for type ${contentType}:`, error);
		return {
			items: [],
			contentType,
			isDev: dev,
			pagination: {
				currentPage: 1,
				totalPages: 1,
				totalItems: 0,
				itemsPerPage: ITEMS_PER_PAGE
			},
			metadata: {
				totalEntries: 0,
				categories: [],
				tags: [],
				lastPublished: new Date().toISOString(),
				lastUpdated: new Date().toISOString()
			},
			error: 'Failed to load content. Please try again later.'
		};
	}
};
