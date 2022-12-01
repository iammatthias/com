import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkStringify from 'remark-stringify';
import ReactMarkdown from 'react-markdown';
import getArweaveEntry from '@/data/arweave/getArweaveEntry';
import getArweavePaths from '@/data/arweave/getArweavePaths';
import uriTransformer from '@/utils/uriTransformer';
import page from './page.module.css';
import Link from 'next/link';
import rehypeRaw from 'rehype-raw';
import { components } from '@/utils/markdown';
import Comments from '@/app/components/comments';

async function getData(slug: string) {
  const entry = await getArweaveEntry(slug);

  const body = await unified()
    .use(remarkParse) // Parse markdown
    .use(remarkStringify) // Serialize markdown
    .process(entry.body);

  return {
    ...entry,
    body: String(body),
    revalidate: 10,
  };
}

export interface Props {
  params?: any;
}

export default async function Page({ params }: Props) {
  const entry = await getData(params.slug);

  return (
    <article>
      <h1>{entry.title}</h1>
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
      {/* @ts-expect-error Server Component */}
      <Comments slug={`${params.slug}`} />
      <div className={page.transaction}>
        <small>
          Tx:{` `}
          <Link
            href={`https://viewblock.io/arweave/tx/${entry.transaction}`}
            target="_blank"
          >
            {entry.transaction}
          </Link>
        </small>
        <p>
          <small>
            Contributor:{` `}
            <Link
              href={`https://etherscan.io/address/${entry.contributor}`}
              target="_blank"
            >
              {entry.contributor}
            </Link>
          </small>
        </p>
      </div>
    </article>
  );
}

export async function generateStaticParams() {
  const paths = await getArweavePaths();

  return paths.map((post: { slug: string }) => ({
    slug: post.slug,
  }));
}
