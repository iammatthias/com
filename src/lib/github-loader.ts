import type { Loader, LoaderContext } from 'astro/loaders';
import { z } from 'astro:schema';

interface GitHubLoaderOptions {
  owner: string;
  repo: string;
  branch?: string;
  contentPath?: string;
  token: string;
}

export const githubContentSchema = z.object({
  title: z.string(),
  slug: z.string(),
  published: z.boolean(),
  created: z.string(),
  updated: z.string(),
  tags: z.array(z.string()).optional(),
  excerpt: z.string().optional(),
});

export type GitHubContentData = z.infer<typeof githubContentSchema>;

export function githubLoader(options: GitHubLoaderOptions): Loader {
  const { owner, repo, branch = 'main', contentPath = 'content', token } = options;

  return {
    name: 'github-markdown-loader',
    load: async ({ collection, store, logger, parseData, generateDigest, renderMarkdown }: LoaderContext) => {
      logger.info(`Loading collection '${collection}' from GitHub`);

      const isDev = import.meta.env.DEV;

      try {
        // First, get the tree for the specific collection folder
        const collectionPath = `${contentPath}/${collection}`;

        const treeQuery = `
          query($owner: String!, $repo: String!, $expression: String!) {
            repository(owner: $owner, name: $repo) {
              object(expression: $expression) {
                ... on Tree {
                  entries {
                    name
                    type
                    object {
                      ... on Blob {
                        oid
                        text
                      }
                    }
                  }
                }
              }
            }
          }
        `;

        const response = await fetch('https://api.github.com/graphql', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: treeQuery,
            variables: {
              owner,
              repo,
              expression: `${branch}:${collectionPath}`,
            },
          }),
        });

        const result = await response.json();

        if (result.errors) {
          logger.error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
          throw new Error(`Failed to fetch from GitHub: ${result.errors[0].message}`);
        }

        const entries = result.data?.repository?.object?.entries || [];

        // Filter for markdown files
        const markdownFiles = entries.filter(
          (entry: any) => entry.type === 'blob' && entry.name.endsWith('.md')
        );

        logger.info(`Found ${markdownFiles.length} markdown files in ${collection}`);

        // Collect all entries for sorting
        const allEntries: Array<{
          id: string;
          data: GitHubContentData;
          body: string;
          rendered: any;
          digest: string;
        }> = [];

        // Process each markdown file
        for (const file of markdownFiles) {
          const content = file.object.text;

          // Parse frontmatter and content
          const { frontmatter, body } = parseFrontmatter(content);

          // Skip unpublished entries in production
          if (!isDev && frontmatter.published !== true) {
            logger.info(`Skipping unpublished entry: ${file.name}`);
            continue;
          }

          // Use slug from frontmatter as ID, or fall back to filename
          const id = frontmatter.slug || file.name.replace(/\.md$/, '');

          // Transform IPFS URIs to CDN URLs before rendering
          const processedBody = body.replace(/ipfs:\/\//g, 'https://cdn.iammatthias.com/ipfs/');

          // Render markdown to HTML
          const rendered = await renderMarkdown(processedBody);

          // Parse and validate data according to schema
          const data = await parseData({
            id,
            data: {
              ...frontmatter,
            },
          }) as GitHubContentData;

          // Generate digest for caching
          const digest = generateDigest(data);

          allEntries.push({
            id,
            data,
            body: processedBody,
            rendered,
            digest,
          });
        }

        // Sort by created date (most recent first)
        allEntries.sort((a, b) => {
          const dateA = new Date(a.data.created || 0).getTime();
          const dateB = new Date(b.data.created || 0).getTime();
          return dateB - dateA;
        });

        // Store sorted entries
        store.clear();
        for (const entry of allEntries) {
          store.set({
            id: entry.id,
            data: entry.data,
            body: entry.body,
            rendered: entry.rendered,
            digest: entry.digest,
          });
          logger.info(`Loaded: ${entry.id}`);
        }

        logger.info(`Successfully loaded ${allEntries.length} entries for ${collection} (${isDev ? 'dev' : 'prod'} mode)`);
      } catch (error) {
        logger.error(`Error loading collection ${collection}: ${error}`);
        throw error;
      }
    },
    schema: async () => githubContentSchema,
  };
}

/**
 * Parse YAML frontmatter from markdown content
 */
function parseFrontmatter(content: string): { frontmatter: Record<string, any>; body: string } {
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
  const match = content.match(frontmatterRegex);

  if (!match) {
    return { frontmatter: {}, body: content };
  }

  const [, frontmatterText, body] = match;
  const frontmatter = parseYaml(frontmatterText);

  return { frontmatter, body };
}

/**
 * Simple YAML parser for frontmatter
 */
function parseYaml(yaml: string): Record<string, any> {
  const result: Record<string, any> = {};
  const lines = yaml.split('\n');
  let currentKey: string | null = null;
  let currentArray: any[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed) continue;

    // Array item
    if (trimmed.startsWith('- ')) {
      const value = trimmed.slice(2).trim();
      currentArray.push(value);
      continue;
    }

    // Key-value pair
    const colonIndex = trimmed.indexOf(':');
    if (colonIndex !== -1) {
      // Save previous array if exists
      if (currentKey && currentArray.length > 0) {
        result[currentKey] = currentArray;
        currentArray = [];
      }

      const key = trimmed.slice(0, colonIndex).trim();
      let value = trimmed.slice(colonIndex + 1).trim();

      // Remove quotes if present
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }

      currentKey = key;

      // Check if it's a boolean
      if (value === 'true') {
        result[key] = true;
      } else if (value === 'false') {
        result[key] = false;
      } else if (value === '') {
        // Empty value means an array might follow
        currentArray = [];
      } else {
        result[key] = value;
      }
    }
  }

  // Save final array if exists
  if (currentKey && currentArray.length > 0) {
    result[currentKey] = currentArray;
  }

  return result;
}

/**
 * Get all available collections from the GitHub repo that have published content
 */
export async function getGitHubCollections(
  owner: string,
  repo: string,
  token: string,
  branch = 'main',
  contentPath = 'content'
): Promise<string[]> {
  const isDev = import.meta.env.DEV;

  const query = `
    query($owner: String!, $repo: String!, $expression: String!) {
      repository(owner: $owner, name: $repo) {
        object(expression: $expression) {
          ... on Tree {
            entries {
              name
              type
              object {
                ... on Tree {
                  entries {
                    name
                    type
                    object {
                      ... on Blob {
                        text
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  `;

  const response = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query,
      variables: {
        owner,
        repo,
        expression: `${branch}:${contentPath}`,
      },
    }),
  });

  const result = await response.json();

  if (result.errors) {
    throw new Error(`Failed to fetch collections: ${result.errors[0].message}`);
  }

  const entries = result.data?.repository?.object?.entries || [];

  // Filter directories and check if they have published content
  const validCollections: string[] = [];

  for (const entry of entries) {
    if (entry.type === 'tree') {
      const markdownFiles = entry.object?.entries?.filter(
        (file: any) => file.type === 'blob' && file.name.endsWith('.md')
      ) || [];

      // Check if any markdown files have published: true
      const hasPublishedContent = markdownFiles.some((file: any) => {
        const content = file.object?.text || '';
        const { frontmatter } = parseFrontmatter(content);
        return isDev || frontmatter.published === true;
      });

      if (hasPublishedContent) {
        validCollections.push(entry.name);
      }
    }
  }

  return validCollections;
}
