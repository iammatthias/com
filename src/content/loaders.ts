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

// Simplified helper to create basic context
async function createBasicContext(contextData: any, collections: string[], logger: any): Promise<string> {
  try {
    const contextParts: string[] = [];

    // Add basic personal context
    contextParts.push("PERSONAL CONTEXT");
    contextParts.push(`Name: ${contextData.name}`);
    contextParts.push(`Title: ${contextData.title}`);
    contextParts.push(`Tagline: ${contextData.tagline}`);

    if (contextData.biography) {
      contextParts.push(`\nBIOGRAPHY: ${contextData.biography}`);
    }

    // Add current role and work information
    if (contextData.currentRole) {
      contextParts.push(`\nCURRENT WORK: ${contextData.currentRole}`);
    }

    // Add contact information
    if (contextData.contact) {
      contextParts.push(`\nCONTACT INFORMATION:`);
      if (contextData.contact.email) {
        contextParts.push(`Email: ${contextData.contact.email}`);
      }
      if (contextData.contact.company) {
        contextParts.push(`Company: ${contextData.contact.company.name} (${contextData.contact.company.url})`);
      }
    }

    // Add social media platforms
    if (contextData.socialPlatforms && contextData.socialPlatforms.length > 0) {
      contextParts.push(`\nSOCIAL MEDIA PLATFORMS:`);
      contextData.socialPlatforms.forEach((platform: any) => {
        const status = platform.status === "active" ? " (ACTIVE)" : " (inactive)";
        contextParts.push(`${platform.name}${status}: ${platform.username} - ${platform.description}`);
        if (platform.url) {
          contextParts.push(`  URL: ${platform.url}`);
        }
      });
    }

    // Add work history (recent positions)
    if (contextData.workHistory && contextData.workHistory.length > 0) {
      contextParts.push(`\nRECENT WORK HISTORY:`);
      // Include the first 3 most recent positions
      contextData.workHistory.slice(0, 3).forEach((job: any) => {
        contextParts.push(`${job.company} - ${job.role} (${job.period})`);
        if (job.achievements && job.achievements.length > 0) {
          contextParts.push(`  Key achievements: ${job.achievements.slice(0, 2).join("; ")}`);
        }
      });
    }

    // Add education
    if (contextData.education && contextData.education.length > 0) {
      contextParts.push(`\nEDUCATION:`);
      contextData.education.forEach((edu: any) => {
        contextParts.push(`${edu.institution} - ${edu.degree} (${edu.period})`);
      });
    }

    // Add personal interests
    if (contextData.personalInterests && contextData.personalInterests.length > 0) {
      contextParts.push(`\nPERSONAL INTERESTS: ${contextData.personalInterests.join(", ")}`);
    }

    // Add philosophy
    if (contextData.philosophy) {
      contextParts.push(`\nPHILOSOPHY: ${contextData.philosophy}`);
    }

    // Add available collections
    contextParts.push(`\nAVAILABLE COLLECTIONS: ${collections.join(", ")}`);

    const basicContext = contextParts.join("\n");
    logger.info(`Enhanced context created for ${collections.length} collections`);

    return basicContext;
  } catch (error) {
    logger.error(`Error creating basic context: ${error instanceof Error ? error.message : "Unknown error"}`);
    return JSON.stringify(contextData, null, 2);
  }
}

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

// Helper to load and parse profile.md for context
async function loadProfileContext(logger: any): Promise<any> {
  try {
    const profilePath = path.join(process.cwd(), "src/content/profile.md");
    const profileContent = await fs.readFile(profilePath, "utf-8");

    if (profileContent.trim().length === 0) {
      logger.warn("Profile.md is empty");
      return null;
    }

    // Parse the markdown frontmatter and content
    const { data: frontmatter, content } = matter(profileContent);

    // Extract context data from the markdown content and frontmatter
    const contextData = {
      name: "Matthias Jordan",
      title: frontmatter.title || "Growth Engineer & Photographer",
      tagline:
        frontmatter.description ||
        "Growth engineer with 10+ years building marketing systems that drive real business outcomes.",
      biography: content.split("\n").slice(0, 10).join("\n"), // First few lines as biography
      currentRole: "Owner at day---break - Growth engineering consultancy",
      contact: {
        email: "matthias@day---break.com",
        company: {
          name: "day---break",
          url: "https://day---break.com",
        },
      },
      socialPlatforms: [
        {
          name: "Warpcast",
          username: "@iammatthias",
          url: "https://warpcast.com/iammatthias",
          status: "active",
          description: "Farcaster is a 'sufficiently decentralized' social protocol",
        },
        {
          name: "Glass",
          username: "@iam",
          url: "https://glass.photo/iam",
          status: "active",
          description: "Photography-centric platform where I post most of my pictures",
        },
        {
          name: "GitHub",
          username: "@iammatthias",
          url: "https://github.com/iammatthias",
          status: "active",
          description: "Work and side projects",
        },
        {
          name: "LinkedIn",
          username: "@iammatthias",
          url: "https://linkedin.com/in/iammatthias",
          status: "active",
          description: "Professional career snapshot",
        },
      ],
      workHistory: [
        {
          company: "day---break",
          role: "Owner",
          period: "August 2024 - Present",
          achievements: ["40% ROI improvement", "25% average customer LTV increase"],
        },
        {
          company: "Ice Barrel",
          role: "Performance Marketing & Web Dev Manager",
          period: "Dec 2023 - Sep 2024",
          achievements: ["150% online revenue increase", "600% conversion rate improvement"],
        },
        {
          company: "Revance",
          role: "Design System Engineer",
          period: "Jan 2023 - Jun 2024",
          achievements: ["40% development time reduction", "GTM and GA4 implementation"],
        },
      ],
      education: [
        {
          institution: "Brooks Institute",
          degree: "Bachelor's Degree, Commercial Photography",
          period: "2010-2014",
        },
      ],
      personalInterests: [
        "Photography",
        "Growth Engineering",
        "Solar-powered computing",
        "Decentralized content systems",
      ],
      philosophy:
        "Most marketing problems are engineering problems in disguise. Build systems that scale, measure everything that matters, optimize relentlessly.",
    };

    return contextData;
  } catch (error) {
    logger.error(`Error loading profile.md: ${error instanceof Error ? error.message : "Unknown error"}`);
    return null;
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

        // Handle context vectorization
        let contextNeedsVectorization = false;
        try {
          const contextData = await loadProfileContext(logger);
          if (contextData && collectionsCache) {
            const basicContext = await createBasicContext(contextData, collectionsCache, logger);
            const contextDigest = generateDigest(basicContext);
            allDigests.set("context", contextDigest);

            const existingContextDigest = existingPinataDigests.get("context");
            if (contextDigest !== existingContextDigest) {
              contextNeedsVectorization = true;
              logger.info(`Context needs vectorization`);
            } else {
              logger.info(`Context up to date`);
            }
          }
        } catch (err) {
          logger.error(`Failed to process profile.md: ${err instanceof Error ? err.message : String(err)}`);
        }

        // Clean up outdated vectors
        const deletedIdentifiers = await selectiveCleanupPinataVectors(allDigests);
        if (deletedIdentifiers.length > 0) {
          logger.info(`Cleaned up ${deletedIdentifiers.length} outdated vectors: ${deletedIdentifiers.join(", ")}`);
        }

        // Vectorize new or changed entries with concurrency control
        if (entriesToVectorize.length > 0) {
          logger.info(`Vectorizing ${entriesToVectorize.length} new or updated entries`);

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

                  // Upload raw markdown directly
                  await uploadAndVectorizeText(content, entryName, digest, keyvalues);
                  logger.info(`Successfully vectorized entry: ${name} (${entry.slug})`);
                } catch (err) {
                  logger.error(
                    `Failed to vectorize entry ${entry.slug}: ${err instanceof Error ? err.message : String(err)}`
                  );
                }
              })
          );

          await Promise.all(vectorizePromises);
        } else {
          logger.info("No entries need vectorization - all vectors are up to date");
        }

        // Vectorize context if needed
        if (contextNeedsVectorization && collectionsCache) {
          await VECTORIZE_LIMIT(async () => {
            try {
              const contextData = await loadProfileContext(logger);
              if (contextData) {
                const basicContext = await createBasicContext(contextData, collectionsCache!, logger);
                logger.info("Vectorizing basic context");
                const contextDigest = generateDigest(basicContext);
                const contextKeyvalues = {
                  type: "context",
                  name: "context",
                  digest: contextDigest, // Include the digest as metadata
                };
                await uploadAndVectorizeText(basicContext, "context.txt", contextDigest, contextKeyvalues);
              }
            } catch (err) {
              logger.error(`Failed to vectorize profile.md: ${err instanceof Error ? err.message : String(err)}`);
            }
          });
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
