import { getObsidianEntries } from "@/lib/obsidian";
import { MetadataRoute } from "next";

const URL = "https://iammatthias.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let allPosts = await getObsidianEntries();

  allPosts = allPosts.reverse();

  if (process.env.NODE_ENV === "production") {
    allPosts = allPosts.filter((post: any) => post.public === true);
  }

  const posts = allPosts.map((post: any) => ({
    url: `${URL}/${post.slug}`,
    lastModified: new Date(post.updated).toISOString(),
  }));

  const routes = [""].map((route) => ({
    url: `${URL}${route}`,
    lastModified: new Date().toISOString(),
  }));

  return [...routes, ...posts];
}
