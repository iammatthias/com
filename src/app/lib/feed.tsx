import fs from "fs";
import { Feed } from "feed";

export default async function rss(posts: any[]) {
  const siteURL = "https://iammatthias.com";
  const date = new Date();
  const author = {
    name: "Matthias Jordan",
    email: "author@iammatthias.com",
    link: "https://iammatthias.com",
  };

  const feed = new Feed({
    title: "I AM MATTHIAS",
    description: "A digital garden of thoughts, ideas, and projects.",
    id: siteURL,
    link: siteURL,
    image: `${siteURL}/logo.svg`,
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
    feed.addItem({
      title: post.name,
      id: post.slug,
      link: post.slug,
      author: [
        {
          name: "Jane Doe",
          email: "janedoe@example.com",
          link: "https://example.com/janedoe",
        },
      ],
      date: new Date(post.published),
    });
  });

  fs.mkdirSync("./public/feed", { recursive: true });
  fs.writeFileSync("./public/feed/rss.xml", feed.rss2());
  fs.writeFileSync("./public/feed/atom.xml", feed.atom1());
  fs.writeFileSync("./public/feed/json.json", feed.json1());

  return null;
}
