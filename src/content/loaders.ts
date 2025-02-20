import { z } from "astro:content";
import type { Loader } from "astro/loaders";
import matter from "gray-matter";
import { fetchFromGitHub } from "./helpers";

// Shared content schema
const contentSchema = z.object({
  title: z.string(),
  slug: z.string(),
  created: z.string(),
  updated: z.string(),
  published: z.boolean(),
  tags: z.array(z.string()),
  path: z.string(),
});

type ContentType = z.infer<typeof contentSchema>;

// Cache for content data
let contentCache: Map<string, any> | null = null;

// Helper to process markdown entries
async function processMarkdownEntries(entries: any[], path: string, isDev: boolean) {
  return entries
    .map((entry) => {
      const { markdown } = entry;
      const { data: frontmatter, content } = matter(markdown);

      // Skip unpublished entries in production
      if (!isDev && !frontmatter.published) {
        return null;
      }

      return {
        frontmatter: {
          ...frontmatter,
          path,
        } as ContentType,
        content,
        markdown,
      };
    })
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null);
}

// Helper to handle GitHub API retries
async function fetchWithRetry(path: string, maxRetries = 3, baseDelay = 2000): Promise<any[]> {
  let retries = maxRetries;
  let delay = baseDelay;

  while (retries > 0) {
    try {
      const entries = await fetchFromGitHub(path);
      return entries;
    } catch (error) {
      retries--;
      if (retries === 0) throw error;

      if (error instanceof Error) {
        // Handle rate limiting
        if (error.message.includes("rate limit")) {
          await new Promise((resolve) => setTimeout(resolve, delay));
          delay *= 2; // Exponential backoff
          continue;
        }

        // Handle other GitHub API errors
        if (error.message.includes("GraphQL")) {
          throw new Error(`GitHub API error for path ${path}: ${error.message}`);
        }
      }

      // Handle unknown errors
      throw new Error(
        `Failed to fetch content from GitHub for path ${path}: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }
  return [];
}

export function contentLoader({ path = "" }: { path?: string }): Loader {
  return {
    name: "content-loader",
    load: async ({ store, logger, generateDigest }) => {
      try {
        // Return cached data if available and in the same path
        if (contentCache?.has(path)) {
          logger.info(`Using cached content data for ${path}`);
          const cachedData = contentCache.get(path);
          for (const entry of cachedData) {
            store.set(entry);
          }
          return;
        }

        logger.info(`Fetching content from GitHub path: ${path}`);

        const entries = await fetchWithRetry(path);

        if (!entries.length) {
          logger.warn(`No entries returned from GitHub for path: ${path}`);
          return;
        }

        const isDev = import.meta.env.DEV;

        // Process entries
        const processedEntries = await processMarkdownEntries(entries, path, isDev);

        if (!processedEntries.length) {
          logger.warn(`No valid entries found for path: ${path}`);
          return;
        }

        // Store processed entries
        const storeEntries = processedEntries.map((entry) => ({
          id: entry.frontmatter.slug,
          data: {
            title: entry.frontmatter.title,
            slug: entry.frontmatter.slug,
            created: entry.frontmatter.created,
            updated: entry.frontmatter.updated,
            published: entry.frontmatter.published,
            tags: entry.frontmatter.tags,
            path: entry.frontmatter.path,
          },
          body: entry.content,
          digest: generateDigest(entry.markdown),
        }));

        // Update cache
        if (!contentCache) {
          contentCache = new Map();
        }
        contentCache.set(path, storeEntries);

        // Store entries
        for (const entry of storeEntries) {
          store.set(entry);
        }

        logger.info(`Successfully loaded ${storeEntries.length} entries from GitHub for ${path}`);
      } catch (error) {
        logger.error(`Error loading entries: ${error instanceof Error ? error.message : "Unknown error"}`);
        throw error; // Propagate error to prevent partial content loading
      }
    },
    schema: contentSchema.extend({
      body: z.string(),
    }),
  };
}

export function tagLoader(): Loader {
  return {
    name: "tag-loader",
    load: async ({ store, parseData, logger }) => {
      try {
        const collections = ["posts", "art", "notes", "recipes"];
        const tagMap = new Map<string, Set<z.infer<typeof contentSchema>>>();

        // Process all collections
        for (const path of collections) {
          if (!contentCache?.has(path)) {
            logger.warn(`Content not found in cache for ${path}, skipping...`);
            continue;
          }

          const entries = contentCache.get(path);

          // Process entries for tags
          entries.forEach((entry) => {
            const { data } = entry;
            if (!data.tags?.length) return;

            data.tags.forEach((tag) => {
              const normalizedTag = tag.toLowerCase().trim();
              if (!tagMap.has(normalizedTag)) {
                tagMap.set(normalizedTag, new Set());
              }
              tagMap.get(normalizedTag)?.add(data);
            });
          });
        }

        // Store processed tags
        for (const [tag, entries] of tagMap.entries()) {
          const parsedData = await parseData({
            id: tag,
            data: {
              tag,
              entries: Array.from(entries),
              count: entries.size,
            },
          });

          store.set({
            id: tag,
            data: parsedData,
          });
        }

        logger.info(`Successfully processed ${tagMap.size} tags from all collections`);
      } catch (error) {
        logger.error(`Error processing tags: ${error instanceof Error ? error.message : "Unknown error"}`);
        throw error; // Propagate error to prevent partial tag loading
      }
    },
    schema: z.object({
      tag: z.string(),
      entries: z.array(contentSchema),
      count: z.number(),
    }),
  };
}

// Glass loader remains unchanged
export function glassLoader(): Loader {
  // Configure the loader
  const feedUrl = new URL(`https://glass.photo/api/v2/users/iam/posts?limit=50`);

  return {
    name: "glass-loader",
    load: async ({ store, parseData, logger }): Promise<void> => {
      try {
        const response = await fetch(feedUrl);
        const data = await response.json();

        for (const post of data) {
          const parsedPost = await parseData({
            id: post.id, // Ensure you provide a unique ID for each post
            data: post,
          });

          store.set({
            id: parsedPost.id,
            data: parsedPost,
          });
        }

        logger.info(`Loaded ${data.length} posts from Glass.`);
      } catch (error) {
        if (error instanceof Error) {
          logger.error(`Failed to load Glass posts: ${error.message}`);
        } else {
          logger.error("Failed to load Glass posts: Unknown error");
        }
      }
    },
    schema: z.object({
      id: z.string(),
      friendly_id: z.string(),
      description: z.string(),
      created_at: z.string(),
      upload_state: z.string(),
      width: z.number(),
      height: z.number(),
      filesize: z.number(),
      user: z.object({
        id: z.string(),
        name: z.string(),
        username: z.string(),
        bio: z.string(),
        website: z.string(),
        pronouns: z.string(),
        profile828x0: z.string(),
        profile192x192: z.string(),
        profile_width: z.number(),
        profile_height: z.number(),
        profile_prominent_color: z.string(),
        is_patron: z.boolean(),
        enable_public_profile: z.boolean(),
        enable_public_comments: z.boolean(),
        enable_profile_comments: z.boolean(),
        share_url: z.string(),
        visibility: z.string(),
      }),
      exif: z.object({
        camera: z.string(),
        lens: z.string(),
        aperture: z.string(),
        focal_length: z.string(),
        iso: z.string(),
        exposure_time: z.string(),
        date_time_original: z.string(),
      }),
      category_ids: z.array(z.nullable(z.string())).nullable(),
      image828x0: z.string(),
      image0x240: z.string(),
      image192x192: z.string(),
      image640x640: z.string(),
      image1656x0: z.string(),
      image800x418: z.string(),
      image_widget_square: z.string(),
      image_widget_landscape: z.string(),
      image1024x1024: z.string(),
      image2048x2048: z.string(),
      image3072x3072: z.string(),
      prominent_color: z.string(),
      share_url: z.string(),
      camera: z.object({
        maker: z.string(),
        maker_slug: z.string(),
        model: z.string(),
        model_slug: z.string(),
      }),
      lens: z.object({
        maker: z.string(),
        maker_slug: z.string(),
        model: z.string(),
        model_slug: z.string(),
      }),
    }),
  };
}
