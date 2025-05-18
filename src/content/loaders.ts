import { z } from "astro:content";
import type { Loader } from "astro/loaders";
import matter from "gray-matter";
import { fetchFromGitHub, fetchContentStructure } from "./helpers";

// Shared content schema
const contentSchema = z.object({
  title: z.string(),
  slug: z.string(),
  created: z.string(),
  updated: z.string(),
  published: z.boolean(),
  tags: z.array(z.string()),
  path: z.string(),
  excerpt: z.string().optional(),
});

type ContentType = z.infer<typeof contentSchema>;

// Cache for content data with digest tracking
let contentCache: Map<string, { entries: any[]; digests: Map<string, string> }> | null = null;
let collectionsCache: string[] | null = null;

// Cache for tag data
let tagCache: Map<string, { data: any; digest: string }> | null = null;

// Cache for Glass data
let glassCache: Map<string, { data: any; digest: string }> | null = null;

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

      // Extract excerpt from content if not provided in frontmatter
      const excerpt =
        frontmatter.excerpt ||
        content
          .split("\n")[0]
          .replace(/^#+\s*/, "")
          .trim();

      return {
        frontmatter: {
          ...frontmatter,
          path,
          excerpt, // Ensure excerpt is always present
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

// Helper to load content for a specific path
async function loadContent(path: string, logger: any): Promise<any[]> {
  try {
    logger.info(`Loading content for path: ${path}`);
    const entries = await fetchWithRetry(path);
    const isDev = import.meta.env.DEV;

    if (!entries.length) {
      logger.warn(`No entries returned for path: ${path}`);
      return [];
    }

    const processedEntries = await processMarkdownEntries(entries, path, isDev);
    return processedEntries;
  } catch (error) {
    logger.error(`Error loading content for ${path}: ${error instanceof Error ? error.message : "Unknown error"}`);
    return [];
  }
}

export function contentLoader(): Loader {
  return {
    name: "content-loader",
    load: async ({ store, logger, generateDigest }) => {
      try {
        // Fetch available collections if not cached
        if (!collectionsCache) {
          logger.info("Fetching content structure from GitHub");
          collectionsCache = await fetchContentStructure();
          if (collectionsCache) {
            logger.info(`Found collections: ${collectionsCache.join(", ")}`);
          } else {
            logger.error("Failed to fetch collections structure");
            return;
          }
        }

        // Initialize cache if not exists
        if (!contentCache) {
          contentCache = new Map();
        }

        // Process each collection
        for (const collection of collectionsCache) {
          const collectionCache = contentCache.get(collection) || { entries: [], digests: new Map() };
          let needsUpdate = false;

          // Check if we need to fetch new content
          if (!collectionCache.entries.length) {
            needsUpdate = true;
          }

          if (needsUpdate) {
            logger.info(`Fetching content from GitHub path: ${collection}`);
            const entries = await fetchWithRetry(collection);

            if (!entries.length) {
              logger.info(`Skipping empty collection: ${collection}`);
              continue;
            }

            const isDev = import.meta.env.DEV;
            const processedEntries = await processMarkdownEntries(entries, collection, isDev);

            if (!processedEntries.length) {
              logger.info(`Skipping collection with no valid entries: ${collection}`);
              continue;
            }

            // Process entries and check digests
            const storeEntries = processedEntries.map((entry) => {
              const digest = generateDigest(entry.markdown);
              const existingDigest = collectionCache.digests.get(entry.frontmatter.slug);

              // Only update if digest changed or entry is new
              if (digest !== existingDigest) {
                needsUpdate = true;
                collectionCache.digests.set(entry.frontmatter.slug, digest);
              }

              return {
                id: entry.frontmatter.slug,
                data: {
                  title: entry.frontmatter.title,
                  slug: entry.frontmatter.slug,
                  created: entry.frontmatter.created,
                  updated: entry.frontmatter.updated,
                  published: entry.frontmatter.published,
                  tags: entry.frontmatter.tags,
                  path: entry.frontmatter.path,
                  excerpt: entry.frontmatter.excerpt,
                },
                body: entry.content,
                digest,
              };
            });

            // Update cache
            collectionCache.entries = storeEntries;
            contentCache.set(collection, collectionCache);

            // Only store entries if there were changes
            if (needsUpdate) {
              for (const entry of storeEntries) {
                store.set(entry);
              }
              logger.info(`Updated ${storeEntries.length} entries from GitHub for ${collection}`);
            } else {
              logger.info(`No changes detected for ${collection}, using cached data`);
            }
          } else {
            // Use cached data
            logger.info(`Using cached content data for ${collection}`);
            for (const entry of collectionCache.entries) {
              store.set(entry);
            }
          }
        }
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
    load: async ({ store, parseData, logger, generateDigest }) => {
      try {
        // Initialize tag cache if not exists
        if (!tagCache) {
          tagCache = new Map();
        }

        // Fetch available collections if not cached
        if (!collectionsCache) {
          logger.info("Fetching content structure from GitHub");
          collectionsCache = await fetchContentStructure();
          if (collectionsCache) {
            logger.info(`Found collections: ${collectionsCache.join(", ")}`);
          } else {
            logger.error("Failed to fetch collections structure");
            return;
          }
        }

        const tagMap = new Map<string, Set<ContentType>>();
        let needsUpdate = false;

        // Load all content first
        const contentPromises = collectionsCache.map((path) => loadContent(path, logger));
        const contentResults = await Promise.all(contentPromises);

        // Process content for tags
        collectionsCache.forEach((path, index) => {
          const entries = contentResults[index];
          if (!entries?.length) {
            logger.info(`Skipping empty collection: ${path}`);
            return;
          }

          entries.forEach((entry) => {
            const { frontmatter } = entry;
            if (!frontmatter.tags?.length) return;

            frontmatter.tags.forEach((tag: string) => {
              const normalizedTag = tag.toLowerCase().trim();
              if (!tagMap.has(normalizedTag)) {
                tagMap.set(normalizedTag, new Set());
              }
              tagMap.get(normalizedTag)?.add(frontmatter);
            });
          });
        });

        if (!tagMap.size) {
          logger.info("No tags found in any collection");
          return;
        }

        // Store processed tags
        for (const [tag, entries] of tagMap.entries()) {
          const tagData = {
            tag,
            entries: Array.from(entries),
            count: entries.size,
          };

          // Generate digest for tag data
          const digest = generateDigest(tagData);
          const existingTag = tagCache.get(tag);

          // Only update if digest changed or tag is new
          if (!existingTag || existingTag.digest !== digest) {
            needsUpdate = true;
            const parsedData = await parseData({
              id: tag,
              data: tagData,
            });

            store.set({
              id: tag,
              data: parsedData,
              digest,
            });

            // Update cache
            tagCache.set(tag, { data: parsedData, digest });
          } else {
            // Use cached data
            store.set({
              id: tag,
              data: existingTag.data,
              digest: existingTag.digest,
            });
          }
        }

        if (needsUpdate) {
          logger.info(`Successfully processed ${tagMap.size} tags from all collections`);
        } else {
          logger.info(`No changes detected in tags, using cached data`);
        }
      } catch (error) {
        logger.error(`Error processing tags: ${error instanceof Error ? error.message : "Unknown error"}`);
        throw error;
      }
    },
    schema: z.object({
      tag: z.string(),
      entries: z.array(contentSchema),
      count: z.number(),
    }),
  };
}

export function glassLoader(): Loader {
  // Configure the loader
  const feedUrl = new URL(`https://glass.photo/api/v2/users/iam/posts?limit=50`);

  return {
    name: "glass-loader",
    load: async ({ store, parseData, logger, generateDigest }): Promise<void> => {
      try {
        // Initialize Glass cache if not exists
        if (!glassCache) {
          glassCache = new Map();
        }

        const response = await fetch(feedUrl);
        const data = await response.json();
        let needsUpdate = false;

        for (const post of data) {
          // Generate digest for post data
          const digest = generateDigest(post);
          const existingPost = glassCache.get(post.id);

          // Only update if digest changed or post is new
          if (!existingPost || existingPost.digest !== digest) {
            needsUpdate = true;
            const parsedPost = await parseData({
              id: post.id,
              data: post,
            });

            store.set({
              id: parsedPost.id,
              data: parsedPost,
              digest,
            });

            // Update cache
            glassCache.set(post.id, { data: parsedPost, digest });
          } else {
            // Use cached data
            store.set({
              id: post.id,
              data: existingPost.data,
              digest: existingPost.digest,
            });
          }
        }

        if (needsUpdate) {
          logger.info(`Updated ${data.length} posts from Glass.`);
        } else {
          logger.info(`No changes detected in Glass posts, using cached data`);
        }
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
