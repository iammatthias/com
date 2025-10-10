import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { getGitHubCollections, type GitHubContentData } from '@lib/github-loader';
import type { APIContext } from 'astro';

type Entry = {
  id: string;
  data: GitHubContentData;
};

export async function getStaticPaths() {
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

  return collectionNames.map((collection) => ({
    params: { collection },
  }));
}

export async function GET(context: APIContext) {
  const { collection } = context.params;

  if (!collection) {
    return new Response('Collection not found', { status: 404 });
  }

  const entries = (await getCollection(collection as any)) as Entry[];

  return rss({
    title: `${collection} - iammatthias`,
    description: `Latest content from ${collection}`,
    site: context.site?.toString() || 'https://iammatthias.com',
    items: entries.map((entry) => ({
      title: entry.data.title,
      pubDate: new Date(entry.data.created),
      description: entry.data.excerpt || '',
      link: `/content/${collection}/${entry.id}/`,
      categories: entry.data.tags || [],
    })),
    customData: '<language>en-us</language>',
    stylesheet: '/rss.xml.xsl',
  });
}
