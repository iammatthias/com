// Helper to fetch content from GitHub using their API
export async function fetchFromGitHub(path = "") {
  const githubToken = import.meta.env.GITHUB;

  if (!githubToken) {
    throw new Error("GitHub token is not configured in environment variables");
  }

  const expression = `HEAD:content/${path}`;

  // Test token with a simpler API call first
  try {
    const testResponse = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `bearer ${githubToken}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    if (!testResponse.ok) {
      const testError = await testResponse.text();
      console.error("Token validation failed:", testError);
      throw new Error("Token validation failed");
    }
  } catch (error) {
    console.error("Token validation error:", error);
    throw error;
  }

  // First, try to verify repository access
  const repoQuery = `
    query verifyRepo {
      repository(owner: "iammatthias", name: "obsidian_cms") {
        id
        visibility
        defaultBranchRef {
          name
        }
      }
    }
  `;

  try {
    // First verify repository access
    const repoResponse = await fetch("https://api.github.com/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `bearer ${githubToken}`,
      },
      body: JSON.stringify({ query: repoQuery }),
    });

    const repoResult = await repoResponse.json();

    if (repoResult.errors) {
      console.error("Repository access error:", repoResult.errors);
      throw new Error("Cannot access repository. Check token permissions.");
    }

    // If repository is accessible, proceed with content fetch
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
        Authorization: `bearer ${githubToken}`,
      },
      body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`GitHub API HTTP error: ${response.status} ${errorText}`);
      throw new Error(`GitHub API request failed: ${response.status}`);
    }

    const result = await response.json();

    if (result.errors) {
      console.error("GraphQL Errors:", result.errors);
      throw new Error(`GraphQL Error: ${JSON.stringify(result.errors)}`);
    }

    if (!result.data?.repository) {
      console.error("No repository data found:", result);
      throw new Error("Repository not found or not accessible");
    }

    // Handle both Tree and Blob responses
    if (result.data.repository.object?.entries?.length) {
      const entries = result.data.repository.object.entries
        .filter((entry: any) => entry.object?.text)
        .map((entry: any) => ({
          id: entry.name,
          markdown: entry.object.text,
        }));

      return entries;
    } else if (result.data.repository.object?.text) {
      return [
        {
          id: path.split("/").pop() || path,
          markdown: result.data.repository.object.text,
        },
      ];
    }

    console.error("Unexpected response structure:", result.data);
    throw new Error(`No valid data returned from GitHub for path: ${path}`);
  } catch (error) {
    if (error instanceof Error) {
      console.error(`GitHub fetch error for path ${path}:`, error);
      throw error;
    }
    throw new Error("An unknown error occurred while fetching from GitHub");
  }
}

// Helper to fetch content directory structure from GitHub
export async function fetchContentStructure() {
  const githubToken = import.meta.env.GITHUB;

  if (!githubToken) {
    throw new Error("GitHub token is not configured in environment variables");
  }

  const query = `
    query fetchContentStructure($owner: String!, $name: String!) {
      repository(owner: $owner, name: $name) {
        object(expression: "HEAD:content") {
          ... on Tree {
            entries {
              name
              type
              object {
                ... on Tree {
                  entries {
                    name
                    type
                  }
                }
              }
            }
          }
        }
      }
    }
  `;

  const variables = {
    owner: "iammatthias",
    name: "obsidian_cms",
  };

  try {
    const response = await fetch("https://api.github.com/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `bearer ${githubToken}`,
      },
      body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`GitHub API HTTP error: ${response.status} ${errorText}`);
      throw new Error(`GitHub API request failed: ${response.status}`);
    }

    const result = await response.json();

    if (result.errors) {
      console.error("GraphQL Errors:", result.errors);
      throw new Error(`GraphQL Error: ${JSON.stringify(result.errors)}`);
    }

    if (!result.data?.repository?.object?.entries) {
      throw new Error("No content structure found");
    }

    // Extract collection names from the content directory
    const collections = result.data.repository.object.entries
      .filter((entry: any) => entry.type === "tree")
      .map((entry: any) => entry.name);

    return collections;
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error fetching content structure:", error);
      throw error;
    }
    throw new Error("An unknown error occurred while fetching content structure");
  }
}
