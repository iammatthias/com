import { Suspense } from 'react';
import getObsidianEntries from '@/data/obsidian/getObsidianEntries';
import getObsidianEntry from '@//data/obsidian/getObsidianEntry';
import MarkdownProvider from '@/utils/markdownProvider';
import Comments from '@/app/components/comments';
import FormatedDateTime from '@/utils/formatedDateTime';

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

  return (
    <article>
      <h1>
        {entry.title == entry.timestamp ? (
          <FormatedDateTime dateTime={entry.timestamp} />
        ) : (
          entry.title
        )}
      </h1>
      <Suspense fallback={<p>Loading...</p>}>
        <MarkdownProvider>{entry.body}</MarkdownProvider>
      </Suspense>
      <Suspense fallback={<p>Loading...</p>}>
        {/* @ts-expect-error Server Component */}
        <Comments path={`md`} slug={`${params.slug}`} />
      </Suspense>
    </article>
  );
}

export async function generateStaticParams() {
  const entries = await getObsidianEntries();

  const _entries = await Promise.all(entries);

  return _entries.map((entry: { slug: string }) => ({
    slug: entry.slug,
  }));
}
