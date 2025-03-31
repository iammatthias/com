import matter from 'gray-matter';

/**
 * Process markdown content through MDSvex
 * This function should only be called server-side
 * @param content The markdown content to process
 * @returns Processed HTML content
 */
export async function processMdsvex(content: string): Promise<string> {
	try {
		// First process frontmatter with gray-matter to handle it properly
		const { content: markdownContent } = matter(content);

		// Dynamically import mdsvex only on the server
		// This ensures the module is not included in client bundles
		const { compile } = await import('mdsvex');

		// Process with MDSvex
		const result = await compile(markdownContent, {
			// MDSvex options
			smartypants: true,
			remarkPlugins: [],
			rehypePlugins: []
		});

		// Return processed content or fallback to original
		return result?.code || '';
	} catch (error) {
		console.error('Error processing markdown with MDSvex:', error);
		// Return a simple HTML representation of the content
		return `<pre class="markdown-fallback">${content.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>`;
	}
}

/**
 * Extract frontmatter from markdown content
 * @param content The markdown content
 * @returns Extracted frontmatter object
 */
export function extractFrontmatter(content: string): Record<string, any> {
	try {
		// Use gray-matter to parse the frontmatter
		const { data } = matter(content);
		return data;
	} catch (error) {
		console.error('Error extracting frontmatter with gray-matter:', error);
		return {};
	}
}
