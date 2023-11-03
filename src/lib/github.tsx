import matter from "gray-matter";

export async function getObsidianEntries() {
  const token = process.env.NEXT_PUBLIC_GITHUB;

  const {
    data: {
      repository: {
        object: { entries },
      },
    },
  } = await fetch(`https://api.github.com/graphql`, {
    method: `POST`,
    headers: {
      "Content-Type": `application/json`,
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      query: `
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
      variables: {
        owner: `iammatthias`,
        name: `obsidian`,
        first: 100,
      },
    }),
    next: {
      revalidate: 1 * 30,
    },
  }).then((res) => res.json());

  return Promise.all(
    entries.map(async (entry: any) => {
      const content = entry.object.text;

      const parsedContent = matter(content);

      const {
        data: { id, name, public: isPublic, tags, created, updated, address },
        content: body,
      } = parsedContent;

      return {
        slug: id,
        name: name,
        created: created * 1,
        updated: updated * 1,
        body: body,
        public: isPublic,
        tags: tags,
        address: address,
      };
    })
  );
}

export async function getObsidianEntry(slug: any) {
  let allPosts = await getObsidianEntries();

  const entry = allPosts.find((entry: any) => entry.slug == slug);

  return entry;
}
