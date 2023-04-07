export default async function getMarkdownEntries() {
  // get markdown entries from github

  // set token
  const token = process.env.NEXT_PUBLIC_GITHUB;

  const res = await fetch(
    `https://api.github.com/repos/iammatthias/Obsidian/contents/Content`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: `application/vnd.github+json`,
        "X-GitHub-Api-Version": "2022-11-28",
      },
    }
  )
    .then((response) => response.json())
    .catch((err) => console.error(err));

  const entries = res.map(async (entry: any) => {
    const { path, sha } = entry;
    return {
      path,
      sha,
    };
  });

  const resolvedEntries = await Promise.all(entries);

  return resolvedEntries;
}
