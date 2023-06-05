import { NextRequest, NextResponse } from "next/server";
import { Feed } from "feed";
import { getAllPublished } from "@/app/lib/notion";
import slugify from "slugify";

export const revalidate = 86400; // 24 hours

export async function GET(req: NextRequest) {
  const siteURL = "https://iammatthias.com";
  const date = new Date();
  const author = {
    name: "Matthias Jordan",
    email: "author@iammatthias.com",
    link: "https://iammatthias.com",
  };

  const posts = await getAllPublished();

  const feed = new Feed({
    title: "I AM MATTHIAS",
    description: "A digital garden of thoughts, ideas, and projects.",
    id: siteURL,
    link: siteURL,
    image: `${siteURL}/api/og`,
    favicon: `${siteURL}/favicon.png`,
    copyright: `All rights reserved ${date.getFullYear()}, Matthias Jordan`,
    updated: date,
    generator: "Feed for Node.js",
    feedLinks: {
      rss2: `${siteURL}/feed/rss.xml`,
      json: `${siteURL}/feed/json.json`,
      atom: `${siteURL}/feed/atom.xml`,
    },
    author,
  });

  posts.forEach((post) => {
    console.log(post);
    feed.addItem({
      title: post.name,
      id: post.slug,
      link: `${siteURL}/content/${post.slug}`,
      image: `${siteURL}/api/og?title=${slugify(post.name)}`,
      author: [
        {
          name: "Matthias Jordan",
          email: "hey@iammatthias.com",
          link: "https://iammatthias.com",
        },
      ],
      date: new Date(post.created),
    });
  });

  // Determine feed type from a query parameter
  const type = req.nextUrl.searchParams.get("type");

  // Generate the correct feed type based on query parameter
  let output;
  let contentType;

  switch (type) {
    case "rss":
      output = feed.rss2();
      contentType = "application/rss+xml";
      break;
    case "json":
      output = feed.json1();
      contentType = "application/json";
      break;
    case "atom":
      output = feed.atom1();
      contentType = "application/atom+xml";
      break;
    default:
      output = feed.rss2();
      contentType = "application/rss+xml";
      break;
  }

  const headers = { "Content-Type": contentType };

  // Use new Response to send the response
  return new Response(output, { headers });
}
