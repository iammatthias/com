import { getEntries } from '@/data/entries';
import Link from 'next/link';

type Props = {
  sortedEntries: [{ postId: string; title: string; timestamp: string }];
};

export default function Page({ sortedEntries: entries }: Props) {
  return (
    <>
      {entries.map((post: any) => (
        <div key={post.postId}>
          <ul>
            <li>
              Post: <Link href={`/writing/${post.slug}`}>{post.title}</Link>
            </li>
            <li>
              <small>Timestamp: {post?.timestamp}</small>
            </li>
          </ul>
        </div>
      ))}
    </>
  );
}

export async function getStaticProps() {
  const entries = await getEntries();

  const sortedEntries = entries.sort(
    (a: { timestamp: number }, b: { timestamp: number }) =>
      a.timestamp - b.timestamp,
  );

  return {
    props: {
      sortedEntries,
    },
    revalidate: 1 * 60, // refresh page index every 5 minutes
  };
}
