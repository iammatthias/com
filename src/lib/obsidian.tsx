import matter from "gray-matter";

// Helper function to fetch data from GitHub GraphQL API
async function fetchFromGitHubGraphQL(query: string, variables: any) {
  const token = process.env.NEXT_PUBLIC_GITHUB;
  const response = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    console.error("HTTP Error:", response.status);
    return response; // Return the response to handle status and errors outside
  }

  return response.json(); // Return the parsed JSON response
}

// Helper function to parse markdown content and structure the response
function parseMarkdownContent(content: string) {
  const { data, content: body } = matter(content);
  return {
    slug: data.id,
    name: data.name,
    created: data.created ? new Date(data.created).getTime() : null,
    updated: data.updated ? new Date(data.updated).getTime() : null,
    body: body,
    public: data.public,
    tags: data.tags,
    address: data.address,
  };
}

// Function to get all entries
export async function getObsidianEntries() {
  const jsonResponse = await fetchFromGitHubGraphQL(
    `
      query fetchEntries($owner: String!, $name: String!) {
        repository(owner: $owner, name: $name) {
          object(expression: "HEAD:Content/") {
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
          }
        }
      }
    `,
    {
      owner: "iammatthias",
      name: "obsidian",
      first: 100, // 'first' parameter is not necessary as there's no pagination implemented
    }
  );

  // Check for errors in the JSON response
  if (jsonResponse.errors) {
    console.error("GraphQL Error:", jsonResponse.errors);
    return [];
  }

  // Ensure that the necessary data is present
  if (!jsonResponse || !jsonResponse.data || !jsonResponse.data.repository || !jsonResponse.data.repository.object) {
    console.error("No data returned from the GraphQL query.");
    return [];
  }

  const entries = jsonResponse.data.repository.object.entries;

  // Process the entries
  return Promise.all(
    entries.map((entry: { object: { text: any } }) => {
      const content = entry.object.text;
      return parseMarkdownContent(content);
    })
  );
}

// Function to get a single entry
export async function getObsidianEntry(slug: string) {
  const data = await fetchFromGitHubGraphQL(
    `
      query fetchSingleEntry($owner: String!, $name: String!, $entryName: String!) {
        repository(owner: $owner, name: $name) {
          object(expression: $entryName) {
            ... on Blob {
              text
            }
          }
        }
      }
    `,
    {
      owner: "iammatthias",
      name: "obsidian",
      entryName: `HEAD:Content/${slug}.md`,
    }
  );

  if (!data || !data.repository || !data.repository.object) {
    return null; // Return null if there's no data
  }

  const text = data.repository.object.text;
  return parseMarkdownContent(text);
}
