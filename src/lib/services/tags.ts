import { getContentByType, getContentTypes, type ContentItem } from './content';

// Cache for tag data
const tagCache = new Map<string, ContentItem[]>();
let allTagsCache: string[] | null = null;

/**
 * Get all content items with a specific tag across all content types
 */
export async function getContentByTag(tag: string, fetchFn?: typeof fetch): Promise<ContentItem[]> {
	try {
		// Check cache first
		if (tagCache.has(tag)) {
			return tagCache.get(tag) || [];
		}

		// Normalize tag for case-insensitive comparison
		const normalizedTag = tag.toLowerCase().trim();

		// Get all content types
		const contentTypes = await getContentTypes(fetchFn);

		// Collect all tagged content
		const taggedContent: ContentItem[] = [];

		// Search for the tag in each content type
		await Promise.all(
			contentTypes.map(async (type) => {
				const items = await getContentByType(type, fetchFn || fetch);

				// Filter items that have the tag
				const withTag = items.filter((item) => {
					const tags = item.metadata?.tags;

					// Check if tags exist and handle different formats
					if (!tags) return false;

					// Handle array of tags
					if (Array.isArray(tags)) {
						return tags.some((t) => t.toLowerCase().trim() === normalizedTag);
					}

					// Handle comma-separated string of tags
					if (typeof tags === 'string') {
						return tags
							.split(',')
							.map((t) => t.trim().toLowerCase())
							.includes(normalizedTag);
					}

					return false;
				});

				// Add type information to each item
				const itemsWithType = withTag.map((item) => ({
					...item,
					type
				}));

				taggedContent.push(...itemsWithType);
			})
		);

		// Sort by date descending
		const sortedContent = taggedContent.sort(
			(a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
		);

		// Save to cache
		tagCache.set(tag, sortedContent);

		return sortedContent;
	} catch (error) {
		console.error(`Error fetching content with tag ${tag}:`, error);
		throw error; // Re-throw to handle in the page load function
	}
}

/**
 * Get all tags used across all content types
 */
export async function getAllTags(fetchFn?: typeof fetch): Promise<string[]> {
	try {
		// Use cache if available
		if (allTagsCache !== null) {
			return allTagsCache;
		}

		const contentTypes = await getContentTypes(fetchFn);
		const tagSet = new Set<string>();

		await Promise.all(
			contentTypes.map(async (type) => {
				const items = await getContentByType(type, fetchFn || fetch);

				items.forEach((item) => {
					const tags = item.metadata?.tags;

					if (!tags) return;

					// Handle array of tags
					if (Array.isArray(tags)) {
						tags.forEach((tag) => tagSet.add(tag.toLowerCase().trim()));
					}

					// Handle comma-separated string
					if (typeof tags === 'string') {
						tags
							.split(',')
							.map((t) => t.trim().toLowerCase())
							.forEach((tag) => tagSet.add(tag));
					}
				});
			})
		);

		const allTags = Array.from(tagSet);
		allTagsCache = allTags;

		return allTags;
	} catch (error) {
		console.error('Error getting all tags:', error);
		throw error; // Re-throw to handle in the page load function
	}
}
