import matter from "gray-matter";

const github = import.meta.env.GITHUB;

// Updated parseMarkdownContent to incorporate tag, slug, and path extraction
async function parseMarkdownContent(content, path = "") {
  const { data, content: body } = matter(content);

  // Ensure path is used correctly in the frontmatter
  const frontmatter = {
    title: data.title || "",
    slug: data.slug || "",
    published: data.published || false,
    created: data.created || "",
    updated: data.updated || "",
    tags: data.tags || [],
    // Only include path in the frontmatter if it's defined and not empty
    path: path ? path : undefined,
  };

  return { frontmatter, body };
}

// Helper function to fetch data from GitHub GraphQL API, ensuring proper path handling
async function fetchFromGitHubGraphQL(path = "", slug = "") {
  let expression = "HEAD:content";
  if (path || slug) {
    expression += path ? `/${path}` : "";
    expression += slug ? `/${slug}.md` : "";
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
      Authorization: `Bearer ${github}`, // Use environment variable for the GitHub token
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new Error(`HTTP Error: ${response.status}`);
  }

  return await response.json();
}

// Function to get all entries, with extended handling for directory names
export async function getObsidianEntries(path = "", slug = "") {
  try {
    const fetchResponse = await fetchFromGitHubGraphQL(path, slug);

    const {
      data: {
        repository: { object },
      },
    } = fetchResponse;

    if (!object) throw new Error("No data returned from the GraphQL query.");

    // Handling directory listing when neither path nor slug is provided
    if (!path && !slug && object.entries) {
      let directoryEntries = await Promise.all(
        object.entries.map(async (dir) => {
          // Re-fetch using the directory name as path
          const dirEntries = await getObsidianEntries(dir.name);
          return { path: dir.name, entries: dirEntries };
        }),
      );

      // Return grouped entries by path
      return directoryEntries.reduce((acc, dir) => {
        acc[dir.path] = dir.entries;
        return acc;
      }, {});
    }

    // Handling a single entry (slug provided)
    if (slug && object.text) {
      return [await parseMarkdownContent(object.text, path)];
    }

    // Handling multiple entries within a given path
    if (object.entries) {
      let parsedEntries = await Promise.all(
        object.entries.map((entry) =>
          parseMarkdownContent(entry.object.text, path),
        ),
      );

      if (process.env.NODE_ENV !== "development") {
        parsedEntries = parsedEntries.filter(
          (entry) => entry.frontmatter.published,
        );
      }

      return parsedEntries;
    } else {
      throw new Error(
        "Unexpected data structure returned from the GraphQL query.",
      );
    }
  } catch (error) {
    console.error(error.message);
    return []; // Adjust error handling as needed
  }
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
}
