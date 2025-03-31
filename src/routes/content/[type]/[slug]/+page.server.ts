import { error } from '@sveltejs/kit';
import { getContentItem } from '$lib/services/content';
import { processMdsvex } from '$lib/utils/markdown';
import { dev } from '$app/environment';
import type { PageServerLoad } from './$types';
import { getStore } from '$lib/store/content-store';

// Enable Incremental Static Regeneration
export const config = {
	isr: {
		expiration: 60 * 60 // Cache for 1 hour
	}
};

// Prerender valid content
export const prerender = true;

// Generate entries for prerendering, though we only use placeholders
export const entries = async () => {
	try {
		// Potentially fetch the store here to get types/slugs if needed for prerendering
		// For now, keeping simple placeholder logic
		// Note: Using global fetch here might be okay if prerendering runs separately,
		// but ideally, prerendering should leverage the store if initialized.
		// const store = await getStore(fetch); // Cannot use event.fetch here
		// const contentTypes = store.contentTypes;
		const contentTypes = ['art', 'blog', 'notes', 'posts', 'melange', 'recipes']; // Placeholder
		return contentTypes.map((type) => ({ type, slug: 'placeholder' }));
	} catch (error) {
		console.error('Error generating entries:', error);
		return [];
	}
};

export const load: PageServerLoad = async ({ params, fetch }) => {
	const { type, slug } = params;

	try {
		// Initialize or get the store to validate the type
		const store = await getStore(fetch);
		const validContentTypes = store.contentTypes;

		// Validate content type using store data
		if (!validContentTypes.includes(type)) {
			throw error(404, `Content type '${type}' not found`);
		}

		// Get the content item using the event fetch
		const item = await getContentItem(type, slug, fetch);

		if (!item) {
			// It's possible the item exists in GitHub but wasn't included in the store
			// (e.g., unpublished in prod). The 404 here is still appropriate.
			throw error(404, `${type} item '${slug}' not found`);
		}

		// Check if content is published
		if (!dev && item.metadata.published === false) {
			throw error(404, `${type} item '${slug}' not found`);
		}

		// Process markdown content
		let processedContent = '';
		try {
			processedContent = await processMdsvex(item.content);
		} catch (err) {
			console.error('Error processing content with MDSvex:', err);
			// Fallback to simple HTML
			processedContent = `<div class="error-content">
				<p>There was an error processing this content.</p>
				<pre>${item.content.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
			</div>`;
		}

		return {
			item: {
				...item,
				processedContent
			},
			contentType: type,
			isDev: dev
		};
	} catch (err) {
		console.error(`Failed to load ${type}/${slug}:`, err);

		if (err instanceof Error && err.message.includes('not found')) {
			throw error(404, `${type} item '${slug}' not found`);
		}

		throw error(500, `Failed to load ${type} item`);
	}
};
