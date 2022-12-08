import { Suspense } from 'react';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkStringify from 'remark-stringify';
import getArweaveEntry from '@/data/arweave/getArweaveEntry';
import getArweavePaths from '@/data/arweave/getArweavePaths';
import page from './page.module.css';
import Link from 'next/link';
import MarkdownProvider from '@/utils/markdownProvider';
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
      <Suspense fallback={<p>Loading...</p>}>
        <MarkdownProvider>{entry.body}</MarkdownProvider>
      </Suspense>
      <Suspense fallback={<p>Loading...</p>}>
        {/* @ts-expect-error Server Component */}
        <Comments slug={`${params.slug}`} />
      </Suspense>
      <Suspense fallback={<p>Loading...</p>}>
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
      </Suspense>
    </article>
  );
}

export async function generateStaticParams() {
  const paths = await getArweavePaths();

  return paths.map((post: { slug: string }) => ({
    slug: post.slug,
  }));
}
