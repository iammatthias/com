import type { Loader, LoaderContext } from "astro/loaders";
import { z } from "astro:schema";
import { ensureCachePopulated, getCachedTagMap } from "./github-loader";

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
  const {
    owner,
    repo,
    token,
    branch = "main",
    contentPath = "content",
  } = options;

  return {
    name: "tags-loader",
    load: async ({
      store,
      logger,
      parseData,
      generateDigest,
    }: LoaderContext) => {
      logger.info("Loading tags from all collections");

      try {
        // Ensure cache is populated (this is a no-op if already done)
        await ensureCachePopulated(owner, repo, token, branch, contentPath);

        // Get the pre-built tag map from the cache
        const tagMap = getCachedTagMap();

        // Convert tag map to entries
        store.clear();
        for (const [tagName, collections] of tagMap.entries()) {
          const data = (await parseData({
            id: tagName,
            data: {
              name: tagName,
              count: collections.size,
              collections: Array.from(collections),
            },
          })) as TagData;

          const digest = generateDigest(data);

          store.set({
            id: tagName,
            data,
            digest,
          });

          logger.info(
            `Loaded tag: ${tagName} (${collections.size} collections)`,
          );
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
