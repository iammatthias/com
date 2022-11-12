import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkStringify from 'remark-stringify';
import ReactMarkdown from 'react-markdown';
import { getArweaveEntry, getArweaveEntryPaths } from '../../../data/arweaveEntries';
import uriTransformer from '../../../utils/uriTransformer';
import page from './page.module.css';
import Link from 'next/link';

export interface Props {
  params?: any;
}

export default async function Page({ params }: Props) {
  const entry = await getData(params.slug);
  const TopLevelCasts = getTopLevelCasts(params.slug);
  const topLevelCasts = await Promise.all([TopLevelCasts]);

  const casts = topLevelCasts[0].map(async (cast: any) => {
    const CastThread = getCastThread(cast.merkleRoot);
    const castThread = await Promise.all([CastThread]);
    const castThreadWithReplies = castThread[0];

    const renderCastThread = castThreadWithReplies.map((cast: any) => {
      console.log(cast);
      return (
        <div key={cast.merkleRoot}>
          <p>{cast.body.publishedAt}</p>
          <p>{cast.body.data.text}</p>
          <p>
            <Link href={cast.uri}>{cast.uri}</Link>
          </p>
        </div>
      );
    });
    return renderCastThread;
  });

  const renderCasts = await Promise.all(casts);

  return (
    <article>
      <h1>{entry.title}</h1>
      <ReactMarkdown transformLinkUri={uriTransformer}>{entry.body}</ReactMarkdown>
      <div className={page.transaction}>
        <small>
          Tx:{' '}
          <Link href={`https://viewblock.io/arweave/tx/${entry.transaction}`} target="_blank">
            {entry.transaction}
          </Link>
        </small>
        <p>
          <small>
            Contributor:{' '}
            <Link href={`https://etherscan.io/address/${entry.contributor}`} target="_blank">
              {entry.contributor}
            </Link>
          </small>
        </p>
      </div>
      {renderCasts}
    </article>
  );
}

export async function generateStaticParams() {
  const paths = await getArweaveEntryPaths();

  return paths.map((post: { slug: any }) => ({
    slug: post.slug,
  }));
}

async function getData(digest: string) {
  const entry = await getArweaveEntry(digest);

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

async function getTopLevelCasts(digest: string) {
  const uri = `https://searchcaster.xyz/api/search?text=${digest}`;
  const res = await fetch(uri).then((res) => res.json());
  const casts = res.casts;

  return casts;
}

async function getCastThread(merkleRoot: string) {
  const uri = `https://searchcaster.xyz/api/search?merkleRoot=${merkleRoot}`;
  const res = await fetch(uri).then((res) => res.json());
  const casts = res.casts;

  return casts;
}
