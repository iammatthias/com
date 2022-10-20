import { getEntries } from '@/data/entries';
import Link from 'next/link';

type Props = {
  sortedEntries: [
    {
      title: string;
      slug: string;
      timestamp: number;
      digest: string;
      transaction: string;
    },
  ];
};

export default function Page({ sortedEntries: entries }: Props) {
  return (
    <>
      {entries.map((post: any) => (
        <div key={post.digest} style={{ borderBottom: `1px solid black` }}>
          Post: <Link href={`/writing/${post.transaction}`}>{post.title}</Link>
          <br />
          <small>Timestamp: {post?.timestamp}</small>
        </div>
      ))}
    </>
  );
}

export async function getStaticProps() {
  const entries = await getEntries();

  const sortedEntries = entries.sort(
    (a: { timestamp: number }, b: { timestamp: number }) =>
      b.timestamp - a.timestamp,
  );

  return {
    props: {
      sortedEntries,
    },
    revalidate: 1 * 60, // refresh page index every 5 minutes
  };
}
