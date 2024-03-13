import matter from "gray-matter";
// import { parseAndMergeTags } from "@lib/tags";

import { db, eq, and, Posts, Tags, PostTags } from "astro:db";
import crypto from "crypto";

const github = import.meta.env.github;

interface Frontmatter {
  title: string;
  slug: string;
  published: boolean;
  created: string;
  updated: string;
  tags: string[];
  path: string;
}

// Updated parseMarkdownContent to incorporate tag, slug, and path extraction
async function parseMarkdownContent(content: string, path: string) {
  const { data, content: body } = matter(content);

  // Add the path to the frontmatter
  // Add the path to the frontmatter
  const frontmatter: Frontmatter = {
    title: data.title || "",
    slug: data.slug || "",
    published: data.published || false,
    created: data.created || "",
    updated: data.updated || "",
    tags: data.tags || [],
    path,
  };

  return { frontmatter, body };
}

// Helper function to fetch data from GitHub GraphQL API
async function fetchFromGitHubGraphQL(path?: string, slug?: string) {
  // Adjust the expression based on whether a path and/or a slug is provided
  let expression = "HEAD:content";
  if (path && slug) {
    expression += `/${path}/${slug}.md`;
  } else if (path) {
    expression += `/${path}`;
  } else if (slug) {
    expression += `/${slug}.md`;
  }

  const query = `
    query fetchEntries($owner: String!, $name: String!, $expression: String!) {
      repository(owner: $owner, name: $name) {
        object(expression: $expression) {
          ... on Tree {
            entries {
              name
              object {
                ... on Blob {
                  text
                }
              }
            }
          }
          ... on Blob {
            text
          }
        }
      }
    }
  `;

  const variables = {
    owner: "iammatthias",
    name: "obsidian_cms",
    expression,
  };

  const response = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${github}`,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    console.error("HTTP Error:", response.status);
    return response; // Return the response to handle status and errors outside
  }

  return response.json(); // Return the parsed JSON response
}

// Function to get all entries
export async function getObsidianEntries(path?: string, slug?: string) {
  const {
    data: {
      repository: { object },
    },
  } = await fetchFromGitHubGraphQL(path, slug);

  // For single entry (when slug is provided)
  if (slug) {
    if (!object || !object.text) {
      console.error("No data returned from the GraphQL query for the single entry.");
      return null;
    }
    return parseMarkdownContent(object.text, path); // assuming parseMarkdownContent can handle individual entries
  }

  // For multiple entries (when no slug is provided)
  if (!object || !object.entries) {
    console.error("No data returned from the GraphQL query for multiple entries.");
    return [];
  }

  const parsedEntries = await Promise.all(
    object.entries.map((entry: { object: { text: any } }) => {
      const content = entry.object.text;
      return parseMarkdownContent(content, path);
    })
  );

  // parseAndMergeTags(parsedEntries); // Assuming this is for bulk entries

  return parsedEntries;
}

export async function getObsidianTags() {
  const {
    data: {
      repository: { object: paths },
    },
  } = await fetchFromGitHubGraphQL();
  const extractedPaths = paths.entries.map((entry) => entry.name);

  for (const path of extractedPaths) {
    const {
      data: {
        repository: { object },
      },
    } = await fetchFromGitHubGraphQL(path);

    for (const entry of object.entries) {
      const content = entry.object.text;
      const parsedContent = await parseMarkdownContent(content, path);
      const { title, slug, tags } = parsedContent.frontmatter;

      // Check if post already exists
      const existingPost = await db.select().from(Posts).where(eq(Posts.slug, slug)).execute();

      let postId;
      if (existingPost.length > 0) {
        // Update the post if it exists
        await db.update(Posts).set({ title }).where(eq(Posts.slug, slug)).execute();
        postId = existingPost[0].id;
      } else {
        // Insert new post if it doesn't exist
        const postInsertionResult = await db.insert(Posts).values({ title, slug, path }).execute();
        postId = Number(postInsertionResult.lastInsertRowid);
      }

      // Handle tags
      for (let i = 0; i < tags.length; i++) {
        const existingTag = await db.select().from(Tags).where(eq(Tags.name, tags[i])).execute();

        let tagId;
        if (existingTag.length > 0) {
          // If tag exists, get its id
          tagId = existingTag[0].id;
        } else {
          // If tag doesn't exist, insert it and get its id
          const tagInsertionResult = await db.insert(Tags).values({ name: tags[i] }).execute();
          tagId = Number(tagInsertionResult.lastInsertRowid);
        }

        // Check if post-tag relationship already exists
        const existingPostTag = await db
          .select()
          .from(PostTags)
          .where(and(eq(PostTags.postId, postId), eq(PostTags.tagId, tagId)))
          .execute();

        if (existingPostTag.length === 0) {
          // If post-tag relationship doesn't exist, insert it
          await db.insert(PostTags).values({ postId, tagId }).execute();
        }
      }
    }
  }
}
