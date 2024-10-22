// Helper to fetch content from GitHub using their API
export async function fetchFromGitHub(path = "") {
  const githubToken = import.meta.env.GITHUB;
  const expression = `HEAD:content/${path}`;

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
      Authorization: `Bearer ${githubToken}`,
    },
    body: JSON.stringify({ query, variables }),
  });

  const result = await response.json();
  if (result.data?.repository?.object?.entries?.length) {
    return result.data.repository.object.entries.map((entry: any) => ({
      id: entry.name,
      markdown: entry.object.text, // Raw markdown content (Astro will parse the frontmatter)
    }));
  }

  throw new Error(`No valid data returned from GitHub for path: ${path}`);
}
