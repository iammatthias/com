import slug from 'slug';
import { calculateSizes } from '../utils/images';

export default async function formatEntry(
  entry: {
    content: { title: string; body: string };
    originalDigest: any;
    digest: any;
    authorship: { contributor: any };
  },
  transactionId: any,
  timestamp: any,
) {
  return {
    title: entry.content.title,
    slug: slug(entry.content.title),
    body: entry.content.body,
    timestamp: timestamp * 1000,
    digest: entry.originalDigest ?? entry.digest,
    contributor: entry.authorship.contributor,
    transaction: transactionId,
    cover_image:
      (entry.content.body
        .split(`\n\n`)[0]
        .match(/!\[[^\]]*\]\((.*?)\s*("(?:.*[^"])")?\s*\)/m) || [])?.[1] || null,
    image_sizes: await calculateSizes(entry.content.body),
    source: `arweave`,
    published: true,
  };
}
