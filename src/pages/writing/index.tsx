import { gql } from '@apollo/client';
import { arweaveQL } from '@/lib/graphql';
import { unified } from 'unified';
import strip from 'strip-markdown';
import remarkParse from 'remark-parse';
import ReactMarkdown from 'react-markdown';
import remarkStringify from 'remark-stringify';

import { calculateSizes } from '@/utils/images';
import Link from 'next/link';

type Props = {
  posts: string[];
};

export default function Page({ posts }: Props) {
  return (
    <>
      {posts.map((post: any) => (
        <div key={post}>
          <Link href={`/writing/${post}`}>{post}</Link>
        </div>
      ))}
    </>
  );
}

export async function getStaticProps({ params }: any) {
  try {
    const {
      data: {
        transactions: { edges },
      },
    } = await arweaveQL.query({
      query: gql`
        query GetWeb3Posts {
          transactions(
            tags: [
              { name: "AppName", values: ["Paragraph"] }
              {
                name: "Contributor"
                values: ["0x429f42fB5247e3a34D88D978b7491d4b2BEe6105"]
              }
            ]
            sort: HEIGHT_DESC
          ) {
            edges {
              node {
                id
              }
            }
          }
        }
      `,
    });

    const arweave = edges.map((edge: any) => edge.node.id);

    return {
      props: {
        posts: arweave,
      },
      revalidate: 1 * 60 * 60, // refresh article contents every hour
    };
  } catch {
    return { notFound: true };
  }
}
