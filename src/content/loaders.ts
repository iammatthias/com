import { z } from "astro:content";
import type { Loader } from "astro/loaders";
import matter from "gray-matter";
import pLimit from "p-limit";
import { fetchFromGitHub, fetchContentStructure } from "./helpers";
import {
  uploadAndVectorizeText,
  selectiveCleanupPinataVectors,
  listGroupFilesWithKeyvaluesInPinata,
} from "../lib/pinata";
import fs from "fs/promises";
import path from "path";

// Timeout wrapper to prevent hanging operations
function withTimeout<T>(promise: Promise<T>, timeoutMs: number, operation: string): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(`Operation "${operation}" timed out after ${timeoutMs}ms`)), timeoutMs)
  );

  return Promise.race([promise, timeoutPromise]);
}

// Concurrency limits
const CONTENT_LIMIT = pLimit(3); // For content processing within collections (not used for collection processing itself)
const VECTORIZE_LIMIT = pLimit(2); // Limit concurrent vectorization operations to Pinata

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
  pinata_cid: z.string().optional(),
});

type ContentType = z.infer<typeof contentSchema>;

// Cache for content data with digest tracking
let contentCache: Map<string, { entries: any[]; digests: Map<string, string> }> | null = null;
let collectionsCache: string[] | null = null;

// Cache for tag data
let tagCache: Map<string, { data: any; digest: string }> | null = null;

// Helper to process markdown entries (simplified)
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
          excerpt,
        } as ContentType,
        content,
        markdown, // Keep the raw markdown for vectorization
      };
    })
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null);
}

// Helper to handle GitHub API retries with concurrency
async function fetchWithRetry(path: string, maxRetries = 3, baseDelay = 2000): Promise<any[]> {
  return CONTENT_LIMIT(async () => {
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
  });
}

// Note: createBasicContext function removed - now using full profile.md content directly

// Helper to load content for a specific path with concurrency
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

// Note: loadProfileContext function removed - now loading profile.md content directly

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

        // Get existing digests from Pinata for comparison
        logger.info("Fetching existing digests from Pinata for comparison");
        const existingPinataDigests = new Map<string, string>();
        try {
          const existingFiles = await listGroupFilesWithKeyvaluesInPinata();
          for (const file of existingFiles) {
            if (file.keyvalues?.digest) {
              const identifier = file.keyvalues?.slug || file.keyvalues?.name || file.name;
              existingPinataDigests.set(identifier, file.keyvalues.digest);
            }
          }
          logger.info(`Found ${existingPinataDigests.size} existing digests in Pinata`);
        } catch (err) {
          logger.error(`Failed to fetch existing digests: ${err instanceof Error ? err.message : String(err)}`);
        }

        // Collect all current digests and entries to vectorize
        const currentDigests = new Map<string, string>();
        const entriesToVectorize: Array<{
          entry: any;
          collection: string;
          digest: string;
          content: string;
          permalinkPath: string;
          name: string;
        }> = [];

        logger.info(`Starting to process ${collectionsCache.length} collections: ${collectionsCache.join(", ")}`);

        // Process each collection - no concurrency limit on collection processing itself
        const collectionPromises = collectionsCache.map(async (collection) => {
          try {
            logger.info(`Starting processing for collection: ${collection}`);
            return await withTimeout(
              (async () => {
                const collectionCache = contentCache!.get(collection) || { entries: [], digests: new Map() };
                let needsUpdate = false;

                // Check if we need to fetch new content
                if (!collectionCache.entries.length) {
                  needsUpdate = true;
                }

                logger.info(
                  `Collection ${collection}: needsUpdate=${needsUpdate}, cacheSize=${collectionCache.entries.length}`
                );

                if (needsUpdate) {
                  logger.info(`Fetching content from GitHub path: ${collection}`);
                  const entries = await fetchWithRetry(collection);
                  logger.info(`Fetched ${entries.length} entries for collection: ${collection}`);

                  if (!entries.length) {
                    logger.info(`Skipping empty collection: ${collection}`);
                    return;
                  }

                  const isDev = import.meta.env.DEV;
                  const processedEntries = await processMarkdownEntries(entries, collection, isDev);
                  logger.info(`Processed ${processedEntries.length} entries for collection: ${collection}`);

                  if (!processedEntries.length) {
                    logger.info(`Skipping collection with no valid entries: ${collection}`);
                    return;
                  }

                  // Process entries and check against Pinata digests
                  const storeEntries = processedEntries.map((entry) => {
                    const storeEntry = {
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
                        pinata_cid: entry.frontmatter.pinata_cid,
                      },
                      body: entry.content,
                    };

                    // Generate digest from the processed store entry (not raw markdown)
                    const storeDigest = generateDigest(storeEntry);
                    const finalStoreEntry = { ...storeEntry, digest: storeDigest };

                    const existingPinataDigest = existingPinataDigests.get(entry.frontmatter.slug);

                    // Update cache digest
                    collectionCache.digests.set(entry.frontmatter.slug, storeDigest);

                    // Add to current digests for published entries
                    if (entry.frontmatter.published === true) {
                      currentDigests.set(entry.frontmatter.slug, storeDigest);

                      // Check if this entry needs vectorization
                      if (storeDigest !== existingPinataDigest) {
                        // Create permalink path
                        const permalinkPath = `/${entry.frontmatter.path}/${entry.frontmatter.slug}`;

                        // Create complete content with frontmatter and body for vectorization
                        const completeContent = `---
${Object.entries(entry.frontmatter)
  .map(([key, value]) => {
    if (Array.isArray(value)) {
      return `${key}:\n${value.map((v) => `  - ${v}`).join("\n")}`;
    }
    return `${key}: ${value}`;
  })
  .join("\n")}
---

${entry.content}`;

                        entriesToVectorize.push({
                          entry: entry.frontmatter,
                          collection,
                          digest: storeDigest,
                          content: completeContent,
                          permalinkPath,
                          name: entry.frontmatter.title,
                        });
                        logger.info(`Entry needs vectorization: ${entry.frontmatter.slug}`);
                      } else {
                        logger.info(`Entry up to date: ${entry.frontmatter.slug}`);
                      }
                    }

                    return finalStoreEntry;
                  });

                  // Update cache
                  collectionCache.entries = storeEntries;
                  contentCache!.set(collection, collectionCache);

                  // Store entries
                  for (const entry of storeEntries) {
                    store.set(entry);
                  }
                  logger.info(`Updated ${storeEntries.length} entries from GitHub for ${collection}`);
                } else {
                  // Use cached data
                  logger.info(`Using cached content data for ${collection}`);
                  for (const entry of collectionCache.entries) {
                    store.set(entry);

                    if (entry.data.published === true) {
                      // Use the cached digest instead of regenerating
                      const cachedDigest = entry.digest;
                      currentDigests.set(entry.data.slug, cachedDigest);

                      const existingPinataDigest = existingPinataDigests.get(entry.data.slug);
                      if (cachedDigest !== existingPinataDigest) {
                        // Create permalink path
                        const permalinkPath = `/${entry.data.path}/${entry.data.slug}`;

                        // Create complete content with frontmatter and body for vectorization
                        const completeContent = `---
${Object.entries(entry.data)
  .map(([key, value]) => {
    if (Array.isArray(value)) {
      return `${key}:\n${value.map((v) => `  - ${v}`).join("\n")}`;
    }
    return `${key}: ${value}`;
  })
  .join("\n")}
---

${entry.body}`;

                        entriesToVectorize.push({
                          entry: entry.data,
                          collection,
                          digest: cachedDigest,
                          content: completeContent,
                          permalinkPath,
                          name: entry.data.title,
                        });
                        logger.info(`Cached entry needs vectorization: ${entry.data.slug}`);
                      }
                    }
                  }
                }
                logger.info(`Completed processing for collection: ${collection}`);
              })(),
              30000, // 30 second timeout per collection
              `processing collection ${collection}`
            );
          } catch (error) {
            logger.error(
              `Error processing collection ${collection}: ${error instanceof Error ? error.message : "Unknown error"}`
            );
            // Continue processing other collections even if one fails
          }
        });

        logger.info("Waiting for all collections to be processed...");
        // Wait for all collections to be processed
        await Promise.all(collectionPromises);
        logger.info("All collections processed successfully!");

        // Perform selective cleanup of vectors based on digest comparison
        logger.info("Performing selective cleanup of Pinata vectors");
        const allDigests = new Map(currentDigests);

        // Handle context files vectorization
        let contextNeedsVectorization = false;
        let contextEntries: Array<{
          entry: any;
          digest: string;
          content: string;
          name: string;
        }> = [];

        try {
          // Load context files from the context folder
          const contextPath = path.join(process.cwd(), "src/content/context");
          const contextFiles = await fs.readdir(contextPath);
          const markdownFiles = contextFiles.filter((file) => file.endsWith(".md"));

          logger.info(`Found ${markdownFiles.length} context files to process`);

          for (const file of markdownFiles) {
            const filePath = path.join(contextPath, file);
            const fileContent = await fs.readFile(filePath, "utf-8");

            if (fileContent.trim().length > 0) {
              const { data: frontmatter, content } = matter(fileContent);

              // Create complete content with frontmatter and body for vectorization
              const completeContent = `---
${Object.entries(frontmatter)
  .map(([key, value]) => {
    if (Array.isArray(value)) {
      return `${key}:\n${value.map((v) => `  - ${v}`).join("\n")}`;
    }
    return `${key}: ${value}`;
  })
  .join("\n")}
---

${content}`;

              const contextDigest = generateDigest(completeContent);
              const contextId = frontmatter.slug || file.replace(".md", "");
              allDigests.set(contextId, contextDigest);

              const existingContextDigest = existingPinataDigests.get(contextId);
              if (contextDigest !== existingContextDigest) {
                contextNeedsVectorization = true;
                contextEntries.push({
                  entry: frontmatter,
                  digest: contextDigest,
                  content: completeContent,
                  name: contextId,
                });
                logger.info(`Context file needs vectorization: ${frontmatter.title || file}`);
              } else {
                logger.info(`Context file up to date: ${frontmatter.title || file}`);
              }
            }
          }

          if (contextNeedsVectorization) {
            logger.info(`Context needs vectorization - ${contextEntries.length} files to process`);
          } else {
            logger.info(`All context files up to date`);
          }
        } catch (err) {
          logger.error(`Failed to process context files: ${err instanceof Error ? err.message : String(err)}`);
        }

        // Clean up outdated vectors
        const deletedIdentifiers = await selectiveCleanupPinataVectors(allDigests);
        if (deletedIdentifiers.length > 0) {
          logger.info(`Cleaned up ${deletedIdentifiers.length} outdated vectors: ${deletedIdentifiers.join(", ")}`);
        }

        // Vectorize new or changed entries with concurrency control
        if (entriesToVectorize.length > 0) {
          logger.info(`Vectorizing ${entriesToVectorize.length} new or updated entries`);

          // Create a map to store CIDs for updating content records
          const cidMap = new Map<string, string>();

          const vectorizePromises = entriesToVectorize.map(
            ({ entry, collection, digest, content, permalinkPath, name }) =>
              VECTORIZE_LIMIT(async () => {
                try {
                  const entryName = `${collection}-${entry.slug}.md`;
                  const keyvalues = {
                    type: "content",
                    slug: entry.slug,
                    name: name,
                    permalink: permalinkPath,
                    digest: digest,
                    created: entry.created,
                    updated: entry.updated,
                    published: entry.published?.toString() || "false",
                    path: entry.path,
                  };

                  // Upload and capture the CID
                  const result = await uploadAndVectorizeText(content, entryName, digest, keyvalues);
                  const cid = result?.cid || result?.IpfsHash;

                  if (cid) {
                    cidMap.set(entry.slug, cid);
                    logger.info(`Successfully vectorized entry: ${name} (${entry.slug}) - CID: ${cid}`);
                  } else {
                    logger.warn(`Vectorized entry ${entry.slug} but no CID returned`);
                  }
                } catch (err) {
                  logger.error(
                    `Failed to vectorize entry ${entry.slug}: ${err instanceof Error ? err.message : String(err)}`
                  );
                }
              })
          );

          await Promise.all(vectorizePromises);

          // Update content records with CIDs
          if (cidMap.size > 0) {
            logger.info(`Updating ${cidMap.size} content records with CIDs`);

            // Update cache with CIDs
            for (const [collection, collectionCache] of contentCache!.entries()) {
              const updatedEntries = collectionCache.entries.map((entry) => {
                const cid = cidMap.get(entry.data.slug);
                if (cid) {
                  return {
                    ...entry,
                    data: {
                      ...entry.data,
                      pinata_cid: cid,
                    },
                  };
                }
                return entry;
              });

              // Update cache
              contentCache!.set(collection, {
                ...collectionCache,
                entries: updatedEntries,
              });

              // Update store
              updatedEntries.forEach((entry) => {
                if (cidMap.has(entry.data.slug)) {
                  store.set(entry);
                }
              });
            }
          }
        } else {
          logger.info("No entries need vectorization - all vectors are up to date");
        }

        // Vectorize context files if needed
        if (contextNeedsVectorization && contextEntries.length > 0) {
          logger.info(`Vectorizing ${contextEntries.length} context files`);

          const contextVectorizePromises = contextEntries.map((contextEntry) =>
            VECTORIZE_LIMIT(async () => {
              try {
                const contextKeyvalues = {
                  type: "profile",
                  name: contextEntry.name,
                  slug: contextEntry.name,
                  title: contextEntry.entry.title || contextEntry.name,
                  digest: contextEntry.digest,
                };
                await uploadAndVectorizeText(
                  contextEntry.content,
                  `${contextEntry.name}.md`,
                  contextEntry.digest,
                  contextKeyvalues
                );
                logger.info(`Successfully vectorized context file: ${contextEntry.entry.title || contextEntry.name}`);
              } catch (err) {
                logger.error(
                  `Failed to vectorize context file ${contextEntry.name}: ${
                    err instanceof Error ? err.message : String(err)
                  }`
                );
              }
            })
          );

          await Promise.all(contextVectorizePromises);
          logger.info("All context files vectorized successfully");
        }
      } catch (error) {
        logger.error(`Error loading entries: ${error instanceof Error ? error.message : "Unknown error"}`);
        throw error;
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

        // Load all content - no concurrency limit on collection processing
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

        // Store processed tags - process sequentially for simplicity
        for (const [tag, entries] of tagMap.entries()) {
          const tagData = {
            tag,
            entries: Array.from(entries),
            count: entries.size,
          };

          const digest = generateDigest(tagData);
          const existingTag = tagCache!.get(tag);

          if (!existingTag || existingTag.digest !== digest) {
            const parsedData = await parseData({
              id: tag,
              data: tagData,
            });

            store.set({
              id: tag,
              data: parsedData,
              digest,
            });

            tagCache!.set(tag, { data: parsedData, digest });
          } else {
            store.set({
              id: tag,
              data: existingTag.data,
              digest: existingTag.digest,
            });
          }
        }

        logger.info(`Successfully processed ${tagMap.size} tags from all collections`);
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
