import { error } from '@sveltejs/kit';
import { getContentByType, getContentFolders, filterPublishedContent } from '$lib/services/content';
import { validateGitHubConfig } from '$lib/server/config-validator';
import { dev } from '$app/environment';
import type { PageServerLoad } from './$types';

// Enable Incremental Static Regeneration
export const config = {
	isr: {
		expiration: 60 * 60 // Cache for 1 hour
	}
};

// Prerender valid content
export const prerender = true;

export const load: PageServerLoad = async ({ params, fetch }) => {
	const { tag } = params;

	try {
		// Check GitHub config
		const configErrors = validateGitHubConfig();
		if (configErrors.length > 0) {
			console.error(`GitHub configuration error in tag/${tag} page:`, configErrors.join(', '));
			return {
				configError: 'GitHub API configuration is incomplete. Check the server logs for details.',
				tag
			};
		}

		// Get all content types
		const contentTypes = await getContentFolders(fetch);

		// Find content with matching tag across all content types
		const taggedContent = [];
		let foundContentType = '';

		for (const type of contentTypes) {
			const content = await getContentByType(type, fetch);
			const filtered = filterPublishedContent(content, dev).filter((item) => {
				const tags = Array.isArray(item.metadata?.tags)
					? item.metadata.tags
					: [item.metadata?.tags];
				return tags.includes(tag);
			});

			if (filtered.length > 0) {
				taggedContent.push(...filtered);
				// Use the first content type that has matching items
				if (!foundContentType) {
					foundContentType = type;
				}
			}
		}

		if (taggedContent.length === 0) {
			throw error(404, {
				message: `No content found with tag '${tag}'`
			});
		}

		return {
			items: taggedContent,
			contentType: foundContentType,
			tag,
			isDev: dev
		};
	} catch (e) {
		console.error(`Failed to load content with tag ${tag}:`, e);

		// Return a more specific error message based on the error type
		const errorMessage =
			e instanceof Error ? e.message : `Unknown error loading content with tag ${tag}`;

		// For GitHub API errors, provide more helpful info in UI
		if (errorMessage.includes('GitHub') || errorMessage.includes('token')) {
			return {
				configError:
					'GitHub API connection error. Please check your GitHub token and configuration.',
				tag
			};
		}

		throw error(500, {
			message: `Failed to load content with tag '${tag}'`
		});
	}
};
