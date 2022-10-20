import { unified } from 'unified';
import remarkParse from 'remark-parse';
import ReactMarkdown from 'react-markdown';
import remarkStringify from 'remark-stringify';

import { getEntry, getEntryPaths } from '@/data/entries';
import TxMeta from '@/components/txMeta';
import uriTransformer from '@/utils/uriTransformer';

type Props = {
  entry: {
    title: string;
    slug: string;
    body: string;
    timestamp: number;
    digest: string;
    transaction: string;
    contributor: string;
    cover_image: string | null;
    image_sizes: { [key: string]: { width: number; height: number } };
  };
};

export default function Page({ entry }: Props) {
  return (
    <>
      <h1>{entry?.title}</h1>
      <ReactMarkdown
        transformLinkUri={uriTransformer}
        // allowDangerousHtml={true}
      >
        {entry?.body}
      </ReactMarkdown>
      <TxMeta tx={entry.transaction} contributor={entry.contributor} />
    </>
  );
}

export async function getStaticPaths() {
  return {
    paths: (await getEntryPaths()).map((path: { slug: any }) => ({
      params: { digest: path.slug },
    })),
    fallback: `blocking`,
  };
}

export async function getStaticProps({ params: { digest } }: any) {
  try {
    const [entry] = await Promise.all([getEntry(digest)]);

    const body = await unified()
      .use(remarkParse) // Parse markdown
      .use(remarkStringify) // Serialize markdown
      .process(entry.body);

    return {
      props: {
        entry: { ...entry, body: String(body) },
      },
      revalidate: 1 * 60 * 60, // refresh article contents every hour
    };
  } catch {
    return { notFound: true };
  }
}
