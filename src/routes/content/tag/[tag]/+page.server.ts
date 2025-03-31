import { error } from '@sveltejs/kit';
import type { PageServerLoad, EntryGenerator } from './$types';
import { getContentByTag, getAllTags } from '$lib/services/tags';
import { filterPublishedContent } from '$lib/services/content';
import { dev } from '$app/environment';

// Enable ISR for tag pages as well
export const config = {
	isr: {
		expiration: 60 * 60, // Cache for 1 hour
		allowQuery: ['tag']
	}
};

// Prerender all known tags
export const prerender = true;

// Generate entries for all known tags
export const entries: EntryGenerator = async () => {
	try {
		const tags = await getAllTags();
		return tags.map((tag) => ({ tag }));
	} catch (error) {
		console.error('Error generating tag entries:', error);
		return [];
	}
};

export const load = (async ({ params }) => {
	try {
		const { tag } = params;

		// Get content for this tag
		const items = await getContentByTag(tag);

		// Filter for published content using the imported dev flag
		const publishedItems = filterPublishedContent(items, dev);

		if (publishedItems.length === 0) {
			throw error(404, `No published content found with tag: ${tag}`);
		}

		return {
			items: publishedItems,
			tag,
			isDev: dev
		};
	} catch (err) {
		console.error(`Error loading content for tag ${params.tag}:`, err);

		if (err instanceof Error && err.message.includes('not found')) {
			throw error(404, `No content found with tag: ${params.tag}`);
		}

		throw error(500, 'Failed to load content');
	}
}) satisfies PageServerLoad;
