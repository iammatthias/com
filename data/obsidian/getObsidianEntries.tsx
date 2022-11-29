import matter from 'gray-matter';

export default async function getObsidianEntries() {
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
      'Content-Type': `application/json`,
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
      revalidate: 10,
    },
  }).then((res) => res.json());

  return entries.map(async (entry: any) => {
    const content = entry.object.text;

    const parsedContent = matter(content);

    const {
      data: { title, created, longform, published },
      content: body,
    } = parsedContent;

    return {
      slug: created,
      title: title,
      longform: longform,
      timestamp: created * 1,
      body: body,
      published: published,
      source: `obsidian`,
    };
  });
}
