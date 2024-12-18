import { z } from "astro:content";
import type { Loader } from "astro/loaders";
import matter from "gray-matter";
import { marked } from "marked";
import { fetchFromGitHub } from "./helpers";

export function obsidianLoader({ path = "" }: { path?: string }): Loader {
  return {
    name: "obsidian-loader",
    load: async ({ store, logger, parseData, generateDigest }) => {
      try {
        logger.info(`Fetching content from GitHub path: ${path}`);
        const entries = await fetchFromGitHub(path);

        if (!entries.length) {
          logger.error(`No entries returned from GitHub for path: ${path}`);
          return;
        }

        // Process each entry and store the structured data
        for (const entry of entries) {
          const { markdown } = entry;
          const digest = generateDigest(markdown);

          // Use gray-matter to parse the frontmatter and content body
          const { data: frontmatter, content } = matter(markdown);

          // Parse and validate the frontmatter and markdown content using the schema
          const parsedData = await parseData({
            id: frontmatter.slug,
            data: {
              frontmatter: {
                title: frontmatter.title,
                slug: frontmatter.slug,
                created: frontmatter.created,
                updated: frontmatter.updated,
                published: frontmatter.published,
                tags: frontmatter.tags,
                path: path,
              },
              body: content, // Use the content (markdown body)
              rendered: {
                html: await marked(content),
              },
            },
          });

          store.set({
            id: parsedData.frontmatter.slug,
            data: {
              frontmatter: {
                title: parsedData.frontmatter.title,
                slug: parsedData.frontmatter.slug,
                created: parsedData.frontmatter.created,
                updated: parsedData.frontmatter.updated,
                published: parsedData.frontmatter.published,
                tags: parsedData.frontmatter.tags,
                path: parsedData.frontmatter.path,
              },
              body: parsedData.body,
            }, // Validated data
            rendered: {
              html: parsedData.rendered.html,
            },
            digest, // Track content integrity using the digest
          });
        }

        logger.info(`Successfully loaded ${entries.length} entries from GitHub.`);
      } catch (error) {
        logger.error(`Error loading entries: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    },
    schema: z.object({
      frontmatter: z.object({
        title: z.string(),
        slug: z.string(),
        created: z.string(),
        updated: z.string(),
        published: z.boolean(),
        tags: z.array(z.string()),
        path: z.string(),
      }),
      body: z.string(), // The body of the markdown content
      rendered: z.object({
        html: z.string(),
      }),
    }),
  };
}

// Define any options that the loader needs
export function glassLoader(): Loader {
  // Configure the loader
  const feedUrl = new URL(`https://glass.photo/api/v2/users/iam/posts`);

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
