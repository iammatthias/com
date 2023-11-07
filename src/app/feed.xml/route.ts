import { getObsidianEntries } from "@/lib/obsidian";
import Rss from "rss";

const URL = "https://iammatthias.com";

export async function GET() {
  let allPosts = await getObsidianEntries();

  allPosts = allPosts.reverse();

  if (process.env.NODE_ENV === "production") {
    allPosts = allPosts.filter((post: any) => post.public === true);
  }

  const feed = new Rss({
    title: "I AM MATTHIAS",
    description: "Products for the eco minded",
    feed_url: `${URL}/feed.xml`,
    site_url: URL,
    language: "en",
  });

  allPosts.forEach((post: any) => {
    feed.item({
      title: post.name,
      url: `${URL}/${post.slug}`,
      guid: `${URL}/${post.slug}`,
      date: new Date(post.created).toISOString(),
    });
  });

  return new Response(feed.xml(), {
    headers: {
      "Content-Type": "application/xml",
    },
  });
}
