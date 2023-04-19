export interface GithubEntry {
  name: string;
  path: string;
}

export default async function fetchMarkdownEntries(): Promise<GithubEntry[]> {
  try {
    const token = process.env.NEXT_PUBLIC_GITHUB;
    const url =
      "https://api.github.com/repos/iammatthias/Obsidian/contents/Content";
    const headers = {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    };

    const response = await fetch(url, { method: "GET", headers });
    const responseData: GithubEntry[] = await response.json();

    return responseData
      .map(({ path, name }) => ({
        path,
        name,
      }))
      .reverse();
  } catch (err) {
    console.error(err);
    return [];
  }
}
