import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import { getObsidianEntry, getObsidianEntries } from '../../../data/obsidianEntries';
import { components } from '../../../utils/markdown';
import uriTransformer from '../../../utils/uriTransformer';

export interface Props {
  params?: any;
  searchParams?: any;
}

export default async function Page({ params, searchParams }: Props) {
  if (!params.slug) {
    return <>Loading...</>;
  }

  const entry = await getData(params.slug);

  console.log(entry);

  const title = entry.title == entry.timestamp ? new Date(entry.timestamp).toLocaleDateString('en-US') : entry.title;

  return (
    <article>
      <h1>{title}</h1>
      <ReactMarkdown
        transformLinkUri={uriTransformer}
        components={{
          // img: components.image as any,
          iframe: components.iframe,
          p: components.paragraph as any,
        }}
        rehypePlugins={[rehypeRaw]}
        children={entry.body}
      />
    </article>
  );
}

export async function generateStaticParams() {
  const paths = await getObsidianEntries();

  const _paths = await Promise.all(paths);

  return _paths.map((post: { slug: string }) => ({
    slug: post.slug,
    next: { revalidate: 60 },
  }));
}

async function getData(slug: string) {
  const entry = await getObsidianEntry(slug);

  return {
    ...entry,
    revalidate: 10,
  };
}
