import type { Loader, LoaderContext } from "astro/loaders";
import { z } from "astro:schema";

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

// ============================================================================
// CACHE SYSTEM - Single fetch, shared across all loaders
// ============================================================================

interface CachedFile {
  name: string;
  content: string;
  frontmatter: Record<string, any>;
  body: string;
}

interface CachedCollection {
  name: string;
  files: CachedFile[];
}

interface ContentCache {
  collections: CachedCollection[];
  collectionNames: string[];
  tagMap: Map<string, Set<string>>;
  fetched: boolean;
}

// Global cache - populated once, used by all loaders
const contentCache: ContentCache = {
  collections: [],
  collectionNames: [],
  tagMap: new Map(),
  fetched: false,
};

/**
 * Fetch all content from GitHub in a single API call and populate the cache.
 * This is called once and the results are shared across all loaders.
 */
async function populateCache(
  owner: string,
  repo: string,
  token: string,
  branch: string,
  contentPath: string,
): Promise<void> {
  if (contentCache.fetched) {
    return;
  }

  const isDev = import.meta.env.DEV;

  // Single GraphQL query to get ALL content
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

  const response = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
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
    throw new Error(`Failed to fetch content: ${result.errors[0].message}`);
  }

  const entries = result.data?.repository?.object?.entries || [];

  // Process each collection directory
  for (const entry of entries) {
    if (entry.type !== "tree") continue;

    const collectionName = entry.name;
    const markdownFiles =
      entry.object?.entries?.filter(
        (file: any) => file.type === "blob" && file.name.endsWith(".md"),
      ) || [];

    const cachedFiles: CachedFile[] = [];
    let hasPublishedContent = false;

    for (const file of markdownFiles) {
      const content = file.object?.text || "";
      const { frontmatter, body } = parseFrontmatter(content);

      // Check if published (or in dev mode)
      const isPublished = isDev || frontmatter.published === true;
      if (isPublished) {
        hasPublishedContent = true;
      }

      cachedFiles.push({
        name: file.name,
        content,
        frontmatter,
        body,
      });

      // Build tag map while we're at it
      if (isPublished && frontmatter.tags && Array.isArray(frontmatter.tags)) {
        for (const tag of frontmatter.tags) {
          if (!contentCache.tagMap.has(tag)) {
            contentCache.tagMap.set(tag, new Set());
          }
          contentCache.tagMap.get(tag)!.add(collectionName);
        }
      }
    }

    // Only include collections with published content
    if (hasPublishedContent) {
      contentCache.collectionNames.push(collectionName);
      contentCache.collections.push({
        name: collectionName,
        files: cachedFiles,
      });
    }
  }

  contentCache.fetched = true;
}

/**
 * Get cached collection data
 */
export function getCachedCollection(
  collectionName: string,
): CachedCollection | undefined {
  return contentCache.collections.find((c) => c.name === collectionName);
}

/**
 * Get cached tag map
 */
export function getCachedTagMap(): Map<string, Set<string>> {
  return contentCache.tagMap;
}

/**
 * Ensure cache is populated
 */
export async function ensureCachePopulated(
  owner: string,
  repo: string,
  token: string,
  branch = "main",
  contentPath = "content",
): Promise<void> {
  await populateCache(owner, repo, token, branch, contentPath);
}

// ============================================================================
// GITHUB LOADER
// ============================================================================

export function githubLoader(options: GitHubLoaderOptions): Loader {
  const {
    owner,
    repo,
    branch = "main",
    contentPath = "content",
    token,
  } = options;

  return {
    name: "github-markdown-loader",
    load: async ({
      collection,
      store,
      logger,
      parseData,
      generateDigest,
      renderMarkdown,
    }: LoaderContext) => {
      logger.info(`Loading collection '${collection}' from GitHub`);

      const isDev = import.meta.env.DEV;

      try {
        // Ensure cache is populated
        await ensureCachePopulated(owner, repo, token, branch, contentPath);

        // Get cached collection data
        const cachedCollection = getCachedCollection(collection);

        if (!cachedCollection) {
          logger.warn(`Collection '${collection}' not found in cache`);
          return;
        }

        // Collect all entries for sorting
        const allEntries: Array<{
          id: string;
          data: GitHubContentData;
          body: string;
          rendered: any;
          digest: string;
        }> = [];

        // Process each cached file
        for (const file of cachedCollection.files) {
          const { frontmatter, body } = file;

          // Skip unpublished entries in production
          if (!isDev && frontmatter.published !== true) {
            logger.info(`Skipping unpublished entry: ${file.name}`);
            continue;
          }

          // Use slug from frontmatter as ID, or fall back to filename
          const id = frontmatter.slug || file.name.replace(/\.md$/, "");

          // Transform IPFS URIs to CDN URLs before rendering
          const processedBody = body.replace(
            /ipfs:\/\//g,
            "https://cdn.iammatthias.com/ipfs/",
          );

          // Render markdown to HTML
          const rendered = await renderMarkdown(processedBody);

          // Parse and validate data according to schema
          const data = (await parseData({
            id,
            data: {
              ...frontmatter,
            },
          })) as GitHubContentData;

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

        logger.info(
          `Successfully loaded ${allEntries.length} entries for ${collection} (${isDev ? "dev" : "prod"} mode)`,
        );
      } catch (error) {
        logger.error(`Error loading collection ${collection}: ${error}`);
        throw error;
      }
    },
    schema: async () => githubContentSchema,
  };
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Parse YAML frontmatter from markdown content
 */
function parseFrontmatter(content: string): {
  frontmatter: Record<string, any>;
  body: string;
} {
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
  const lines = yaml.split("\n");
  let currentKey: string | null = null;
  let currentArray: any[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed) continue;

    // Array item
    if (trimmed.startsWith("- ")) {
      const value = trimmed.slice(2).trim();
      currentArray.push(value);
      continue;
    }

    // Key-value pair
    const colonIndex = trimmed.indexOf(":");
    if (colonIndex !== -1) {
      // Save previous array if exists
      if (currentKey && currentArray.length > 0) {
        result[currentKey] = currentArray;
        currentArray = [];
      }

      const key = trimmed.slice(0, colonIndex).trim();
      let value = trimmed.slice(colonIndex + 1).trim();

      // Remove quotes if present
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      currentKey = key;

      // Check if it's a boolean
      if (value === "true") {
        result[key] = true;
      } else if (value === "false") {
        result[key] = false;
      } else if (value === "") {
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
 * Get all available collections from the GitHub repo that have published content.
 * Uses cached data - only fetches from GitHub once.
 */
export async function getGitHubCollections(
  owner: string,
  repo: string,
  token: string,
  branch = "main",
  contentPath = "content",
): Promise<string[]> {
  await ensureCachePopulated(owner, repo, token, branch, contentPath);
  return contentCache.collectionNames;
}
