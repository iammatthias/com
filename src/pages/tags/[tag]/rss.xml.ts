import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { getGitHubCollections, type GitHubContentData } from '@lib/github-loader';
import type { TagData } from '@lib/tags-loader';
import type { APIContext } from 'astro';

type TagEntry = {
  id: string;
  data: TagData;
};

type Entry = {
  id: string;
  data: GitHubContentData;
  collection: string;
};

export async function getStaticPaths() {
  const tags = (await getCollection('tags')) as TagEntry[];

  return tags.map((tag) => ({
    params: { tag: tag.id },
  }));
}

export async function GET(context: APIContext) {
  const { tag } = context.params;

  if (!tag) {
    return new Response('Tag not found', { status: 404 });
  }

  const GITHUB_OWNER = 'iammatthias';
  const GITHUB_REPO = 'obsidian_cms';
  const GITHUB_TOKEN = import.meta.env.GITHUB;

  const collectionNames = await getGitHubCollections(
    GITHUB_OWNER,
    GITHUB_REPO,
    GITHUB_TOKEN,
    'main',
    'content'
  );

  // Get all entries from all collections and filter by tag
  const entriesWithTag: Entry[] = [];

  for (const collectionName of collectionNames) {
    const entries = (await getCollection(collectionName as any)) as Entry[];

    for (const entry of entries) {
      if (entry.data.tags?.includes(tag as string)) {
        entriesWithTag.push({
          ...entry,
          collection: collectionName,
        });
      }
    }
  }

  // Sort by created date (most recent first)
  entriesWithTag.sort((a, b) => {
    const dateA = new Date(a.data.created || 0).getTime();
    const dateB = new Date(b.data.created || 0).getTime();
    return dateB - dateA;
  });

  return rss({
    title: `#${tag} - iammatthias`,
    description: `Content tagged with ${tag}`,
    site: context.site?.toString() || 'https://iammatthias.com',
    items: entriesWithTag.map((entry) => ({
      title: entry.data.title,
      pubDate: new Date(entry.data.created),
      description: entry.data.excerpt || '',
      link: `/content/${entry.collection}/${entry.id}/`,
      categories: entry.data.tags || [],
    })),
    customData: '<language>en-us</language>',
    stylesheet: '/rss.xml.xsl',
  });
}
