import { env } from '$env/dynamic/private';
import { getAllMarkdownContent } from '$lib/utils/github';
import { getContentFolders } from '$lib/utils/github';

// Define the base URL for the sitemap
const BASE_URL = 'https://iammatthias.com'; // You should update this to match your domain

// Static routes that should always be included
const STATIC_ROUTES = [
	'', // home page
	'about',
	'contact'
];

// Cache duration
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

// Declare global cache type if not already declared
declare global {
	var sitemapCache: {
		content: string;
		timestamp: number;
	} | null;
}

export const GET = async ({ fetch }) => {
	// Check if we have a valid cache
	if (global.sitemapCache && Date.now() - global.sitemapCache.timestamp < CACHE_DURATION) {
		return new Response(global.sitemapCache.content, {
			headers: {
				'Content-Type': 'application/xml',
				'Cache-Control': `public, max-age=${CACHE_DURATION / 1000}`
			}
		});
	}

	try {
		// Start building the sitemap
		let sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n';
		sitemap += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

		// Add static routes
		for (const route of STATIC_ROUTES) {
			sitemap += `  <url>
    <loc>${BASE_URL}${route ? `/${route}` : ''}</loc>
    <changefreq>weekly</changefreq>
    <priority>${route === '' ? '1.0' : '0.8'}</priority>
  </url>\n`;
		}

		// Get all content folders
		const contentFolders = await getContentFolders(fetch);

		// Add dynamic content routes
		for (const folder of contentFolders) {
			// Add the folder index page
			sitemap += `  <url>
    <loc>${BASE_URL}/content/${folder}</loc>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>\n`;

			// Get all markdown content for this folder
			const content = await getAllMarkdownContent(folder, fetch);

			for (const item of content) {
				// Extract slug from the path
				const slug = item.path
					.split('/')
					.pop()
					?.replace(/\.(md|svx)$/, '');

				if (slug) {
					sitemap += `  <url>
    <loc>${BASE_URL}/content/${folder}/${slug}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>\n`;
				}
			}
		}

		// Add tag pages if they exist
		const allTags = new Set<string>();

		// Collect tags from all content types
		for (const folder of contentFolders) {
			const content = await getAllMarkdownContent(folder, fetch);

			// Process each item's tags
			content.forEach((item) => {
				const frontmatter = item.frontmatter;
				if (frontmatter?.tags) {
					const itemTags = Array.isArray(frontmatter.tags)
						? frontmatter.tags
						: frontmatter.tags.split(',').map((t: string) => t.trim());
					itemTags.forEach((tag: string) => allTags.add(tag));
				}
			});
		}

		// Add tag pages to sitemap
		for (const tag of allTags) {
			sitemap += `  <url>
    <loc>${BASE_URL}/content/tag/${encodeURIComponent(tag)}</loc>
    <changefreq>daily</changefreq>
    <priority>0.6</priority>
  </url>\n`;
		}

		sitemap += '</urlset>';

		// Update global cache
		global.sitemapCache = {
			content: sitemap,
			timestamp: Date.now()
		};

		return new Response(sitemap, {
			headers: {
				'Content-Type': 'application/xml',
				'Cache-Control': `public, max-age=${CACHE_DURATION / 1000}`
			}
		});
	} catch (error) {
		console.error('Error generating sitemap:', error);
		return new Response('Error generating sitemap', { status: 500 });
	}
};
