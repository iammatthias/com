import { getEntries } from '@/data/entries';
import Link from 'next/link';

type Props = {
  entries: [{ postId: string; title: string; timestamp: string }];
};

export default function Page({ entries }: Props) {
  return (
    <>
      {entries.map((post: any) => (
        <div key={post.postId}>
          <ul>
            <li>
              Post: <Link href={`/writing/${post.slug}`}>{post.title}</Link>
            </li>
            <li>
              <small>Timestamp: {post.timestamp}</small>
            </li>
            <li>
              <small>
                Tx:{` `}
                <Link
                  href={`https://viewblock.io/arweave/tx/${post.transaction}`}
                  target="_blank"
                >
                  {post.transaction}
                </Link>
              </small>
            </li>
          </ul>
        </div>
      ))}
    </>
  );
}

export async function getStaticProps() {
  const entries = await getEntries();

  return {
    props: {
      entries,
    },
    revalidate: 1 * 60, // refresh page index every 5 minutes
  };
}
