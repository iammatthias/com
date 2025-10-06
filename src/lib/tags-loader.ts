import type { Loader, LoaderContext } from 'astro/loaders';
import { z } from 'astro:schema';
import { getGitHubCollections } from './github-loader';

interface TagsLoaderOptions {
  owner: string;
  repo: string;
  token: string;
  branch?: string;
  contentPath?: string;
}

export const tagsSchema = z.object({
  name: z.string(),
  count: z.number(),
  collections: z.array(z.string()),
});

export type TagData = z.infer<typeof tagsSchema>;

export function tagsLoader(options: TagsLoaderOptions): Loader {
  const { owner, repo, token, branch = 'main', contentPath = 'content' } = options;

  return {
    name: 'tags-loader',
    load: async ({ store, logger, parseData, generateDigest }: LoaderContext) => {
      logger.info('Loading tags from all collections');

      try {
        // Get all collection names
        const collectionNames = await getGitHubCollections(owner, repo, token, branch, contentPath);

        // Map to track tags and their associated entries
        const tagMap = new Map<string, Set<string>>();

        // Fetch all entries from all collections
        for (const collectionName of collectionNames) {
          const collectionPath = `${contentPath}/${collectionName}`;

          const query = `
            query($owner: String!, $repo: String!, $expression: String!) {
              repository(owner: $owner, name: $repo) {
                object(expression: $expression) {
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
                expression: `${branch}:${collectionPath}`,
              },
            }),
          });

          const result = await response.json();
          const entries = result.data?.repository?.object?.entries || [];
          const markdownFiles = entries.filter(
            (entry: any) => entry.type === 'blob' && entry.name.endsWith('.md')
          );

          // Parse each file and extract tags
          for (const file of markdownFiles) {
            const content = file.object.text;
            const tags = extractTagsFromContent(content);

            if (tags.length > 0) {
              tags.forEach((tag) => {
                if (!tagMap.has(tag)) {
                  tagMap.set(tag, new Set());
                }
                tagMap.get(tag)!.add(collectionName);
              });
            }
          }
        }

        // Convert tag map to entries
        store.clear();
        for (const [tagName, collections] of tagMap.entries()) {
          const data = await parseData({
            id: tagName,
            data: {
              name: tagName,
              count: collections.size,
              collections: Array.from(collections),
            },
          }) as TagData;

          const digest = generateDigest(data);

          store.set({
            id: tagName,
            data,
            digest,
          });

          logger.info(`Loaded tag: ${tagName} (${collections.size} collections)`);
        }

        logger.info(`Successfully loaded ${tagMap.size} tags`);
      } catch (error) {
        logger.error(`Error loading tags: ${error}`);
        throw error;
      }
    },
    schema: async () => tagsSchema,
  };
}

/**
 * Extract tags from markdown frontmatter
 */
function extractTagsFromContent(content: string): string[] {
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n/;
  const match = content.match(frontmatterRegex);

  if (!match) {
    return [];
  }

  const frontmatter = match[1];
  const lines = frontmatter.split('\n');
  const tags: string[] = [];
  let inTagsSection = false;

  for (const line of lines) {
    const trimmed = line.trim();

    // Check if we're starting the tags section
    if (trimmed === 'tags:') {
      inTagsSection = true;
      continue;
    }

    // If we hit another key, we're done with tags
    if (inTagsSection && trimmed.includes(':') && !trimmed.startsWith('-')) {
      break;
    }

    // Extract tag items
    if (inTagsSection && trimmed.startsWith('-')) {
      const tag = trimmed.slice(1).trim();
      if (tag) {
        tags.push(tag);
      }
    }
  }

  return tags;
}
