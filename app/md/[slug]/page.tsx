import { Suspense } from 'react';
import getObsidianEntries from '@/data/obsidian/getObsidianEntries';
import getObsidianEntry from '@//data/obsidian/getObsidianEntry';
import MarkdownProvider from '@/utils/markdownProvider';
import Comments from '@/app/components/comments';

async function getData(slug: string) {
  const entry = await getObsidianEntry(slug);

  return {
    ...entry,
  };
}

export interface Props {
  params?: any;
  searchParams?: any;
}

export default async function Page({ params }: Props) {
  if (!params.slug) {
    return <>Loading...</>;
  }

  const entry = await getData(params.slug);

  const pstTimestamp = new Date(entry.timestamp).toLocaleString(`en-US`, {
    timeZone: `America/Los_Angeles`,
  });

  const title =
    entry.title == entry.timestamp
      ? new Date(pstTimestamp).toLocaleDateString(`en-US`)
      : entry.title;

  return (
    <article>
      <h1>{title}</h1>
      <Suspense fallback={<p>Loading...</p>}>
        <MarkdownProvider>{entry.body}</MarkdownProvider>
      </Suspense>
      <Suspense fallback={<p>Loading...</p>}>
        {/* @ts-expect-error Server Component */}
        <Comments path={`md/`} slug={`${params.slug}`} />
      </Suspense>
    </article>
  );
}

export async function generateStaticParams() {
  const paths = await getObsidianEntries();

  const _paths = await Promise.all(paths);

  return _paths.map((post: { slug: string }) => ({
    slug: post.slug,
  }));
}
