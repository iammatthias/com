import matter from "gray-matter";
import { parseAndMergeTags } from "./tags";

const github = import.meta.env.github;

// Updated parseMarkdownContent to incorporate tag, slug, and path extraction
async function parseMarkdownContent(content: string, path: string) {
  const { data, content: body } = matter(content);

  // Add the path to the frontmatter
  const frontmatter = { ...data, path };

  return { frontmatter, body };
}

// Helper function to fetch data from GitHub GraphQL API
async function fetchFromGitHubGraphQL(query: string, variables: any) {
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
export async function getObsidianEntries(path: string, slug?: string) {
  // Adjust the expression based on whether a slug is provided
  const expression = slug ? `HEAD:content/${path}/${slug}.md` : `HEAD:content/${path}`;

  const {
    data: {
      repository: { object },
    },
  } = await fetchFromGitHubGraphQL(
    `
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
    `,
    {
      owner: "iammatthias",
      name: "obsidian_cms",
      expression,
    }
  );

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

  parseAndMergeTags(parsedEntries); // Assuming this is for bulk entries

  return parsedEntries;
}
