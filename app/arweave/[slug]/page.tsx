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

    const sortedCastThread = castThreadWithReplies.sort((a: any, b: any) => a.body.publishedAt - b.body.publishedAt);

    const renderCastThread = sortedCastThread.map((cast: any) => {
      const publishedAt = new Date(cast.body.publishedAt).toLocaleDateString('en-US');

      return (
        <div key={cast.merkleRoot} className={page.list}>
          <div className={page.listTopRow}>
            <p>{publishedAt}</p>
            <p>
              <Link href={`https://www.discove.xyz/profiles/${cast.body.username}`}>@{cast.body.username}</Link>
            </p>
          </div>
          <p>{cast.body.data.text}</p>
          <p>
            <Link href={cast.uri}>View on Farcaster</Link>
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
      <div className={page.list}>{renderCasts}</div>
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
