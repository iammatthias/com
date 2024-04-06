import matter from "gray-matter";
import { parseAndMergeTags } from "./tags.ts";

const github = import.meta.env.GITHUB;

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
export async function getObsidianEntries(path: string = "", slug?: string) {
  const {
    data: {
      repository: { object },
    },
  } = await fetchFromGitHubGraphQL(path, slug);

  // For single entry (when slug is provided)
  if (slug) {
    if (!object || !object.text) {
      console.error(
        "No data returned from the GraphQL query for the single entry.",
      );
      return [];
    }
    const singleEntry = await parseMarkdownContent(object.text, path);
    return [singleEntry]; // Return as an array
  }

  // For multiple entries (when no slug is provided)
  if (!object || !object.entries) {
    console.error(
      "No data returned from the GraphQL query for multiple entries.",
    );
    return [];
  }

  let parsedEntries = await Promise.all(
    object.entries.map((entry: { object: { text: any } }) => {
      const content = entry.object.text;
      return parseMarkdownContent(content, path);
    }),
  );

  // if in development, return all entries
  // if not in development, filter out entries where frontmatter.published is false
  if (process.env.NODE_ENV !== "development") {
    parsedEntries = parsedEntries.filter(
      (entry) => entry.frontmatter.published !== false,
    );
  }

  return parsedEntries;
}

// getObsidianTags
export async function getObsidianTags() {
  const {
    data: {
      repository: { object: paths },
    },
  } = await fetchFromGitHubGraphQL();
  const extractedPaths = paths.entries.map((entry) => entry.name);

  let entries: any[] = [];
  // Sort entries based on the 'created' field
  entries = entries.sort(
    (a, b) =>
      new Date(b.frontmatter.created).getTime() -
      new Date(a.frontmatter.created).getTime(),
  );

  // Filter out entries where frontmatter.published is false only in production
  if (process.env.NODE_ENV !== "development") {
    entries = entries.filter((entry) => entry.frontmatter.published !== false);
  }

  // Loop through each path to get the entries and merge them into a single array
  for (const path of extractedPaths) {
    const pathEntries = await getObsidianEntries(path);
    entries = entries.concat(pathEntries);
  }

  parseAndMergeTags(entries);
}
