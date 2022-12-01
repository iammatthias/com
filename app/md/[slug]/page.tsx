import { Suspense } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import getObsidianEntries from '../../../data/obsidian/getObsidianEntries';
import getObsidianEntry from '../../../data/obsidian/getObsidianEntry';
import { components } from '../../../utils/markdown';
import uriTransformer from '../../../utils/uriTransformer';

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

  const title =
    entry.title == entry.timestamp
      ? new Date(entry.timestamp).toLocaleDateString(`en-US`)
      : entry.title;

  return (
    <article>
      <h1>{title}</h1>
      <Suspense fallback={<p>Loading...</p>}>
        <ReactMarkdown
          transformLinkUri={uriTransformer}
          components={{
            // img: components.image as any,
            iframe: components.iframe,
            p: components.paragraph as any,
          }}
          rehypePlugins={[rehypeRaw]}
        >
          {entry.body}
        </ReactMarkdown>
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
