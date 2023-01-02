import fs from 'fs';
import { Feed } from 'feed';

export default async function rss(entries: any[]) {
  const siteURL = 'https://iammatthias.com';
  const date = new Date();
  const author = {
    name: 'Matthias Jordan',
    email: 'author@iammatthias.com',
    link: 'https://iammatthias.com',
  };

  const feed = new Feed({
    title: 'I AM MATTHIAS',
    description: 'A digital garden of thoughts, ideas, and projects.',
    id: siteURL,
    link: siteURL,
    image: `${siteURL}/logo.svg`,
    favicon: `${siteURL}/favicon.png`,
    copyright: `All rights reserved ${date.getFullYear()}, Matthias Jordan`,
    updated: date,
    generator: 'Feed for Node.js',
    feedLinks: {
      rss2: `${siteURL}/rss/feed.xml`,
      json: `${siteURL}/rss/feed.json`,
      atom: `${siteURL}/rss/atom.xml`,
    },
    author,
  });

  entries.forEach(
    (entry: {
      [x: string]: any;
      slug: any;
      title: any;
      summary: any;
      timestamp: string | number | Date;
    }) => {
      const url = `${siteURL}/${
        entry.source == 'obsidian' ? 'md' : entry.source == 'arweave' ? 'arweave' : 'blog'
      }/${entry.slug}`;
      feed.addItem({
        title: entry.title,
        id: url,
        link: url,
        description: entry.summary,
        content: entry.summary,
        author: [author],
        contributor: [author],
        date: new Date(entry.timestamp),
      });
    },
  );

  fs.mkdirSync('./public/rss', { recursive: true });
  fs.writeFileSync('./public/rss/feed.xml', feed.rss2());
  fs.writeFileSync('./public/rss/atom.xml', feed.atom1());
  fs.writeFileSync('./public/rss/feed.json', feed.json1());

  return null;
}
