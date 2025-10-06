import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import { getGitHubCollections, type GitHubContentData } from "@lib/github-loader";
import type { APIContext } from "astro";

type Entry = {
  id: string;
  data: GitHubContentData;
  collection: string;
};

export async function GET(context: APIContext) {
  const GITHUB_OWNER = "iammatthias";
  const GITHUB_REPO = "obsidian_cms";
  const GITHUB_TOKEN = import.meta.env.GITHUB;

  const collectionNames = await getGitHubCollections(GITHUB_OWNER, GITHUB_REPO, GITHUB_TOKEN, "main", "content");

  // Gather all entries from all collections
  const allEntries: Entry[] = [];

  for (const collectionName of collectionNames) {
    const entries = (await getCollection(collectionName as any)) as Entry[];
    entries.forEach((entry) => {
      allEntries.push({
        ...entry,
        collection: collectionName,
      });
    });
  }

  // Sort by created date (most recent first)
  allEntries.sort((a, b) => {
    const dateA = new Date(a.data.created || 0).getTime();
    const dateB = new Date(b.data.created || 0).getTime();
    return dateB - dateA;
  });

  return rss({
    title: "iammatthias",
    description: "All content from iammatthias.com",
    site: context.site?.toString() || "https://iammatthias.com",
    items: allEntries.map((entry) => ({
      title: entry.data.title,
      pubDate: new Date(entry.data.created),
      description: entry.data.excerpt || "",
      link: `/content/${entry.collection}/${entry.id}/`,
      categories: entry.data.tags || [],
    })),
    customData: "<language>en-us</language>",
    stylesheet: "/rss.xml.xsl",
  });
}
