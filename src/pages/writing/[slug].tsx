import { unified } from 'unified';
import remarkParse from 'remark-parse';
import ReactMarkdown from 'react-markdown';
import remarkStringify from 'remark-stringify';

import { getEntry, getEntryPaths } from '@/data/entries';

type Props = {
  entry: {
    title: string;
    body: string;
  };
};

export default function Page({ entry }: Props) {
  return (
    <>
      <h1>{entry?.title}</h1>
      <ReactMarkdown>{entry?.body}</ReactMarkdown>
    </>
  );
}

export async function getStaticPaths() {
  return {
    paths: (await getEntryPaths()).map((path: any) => ({
      params: {
        slug: path.slug,
      },
    })),
    fallback: `blocking`,
  };
}

export async function getStaticProps({ params: { slug } }: any) {
  const paths = await getEntryPaths();
  const path = paths.find((path: any) => path.slug === slug);
  const entry = await getEntry(path.id);

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
}
