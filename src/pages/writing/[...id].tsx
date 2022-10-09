import { gql } from '@apollo/client';
import { arweaveQL } from '@/lib/graphql';
import { unified } from 'unified';
import strip from 'strip-markdown';
import remarkParse from 'remark-parse';
import ReactMarkdown from 'react-markdown';
import remarkStringify from 'remark-stringify';

import { calculateSizes } from '@/utils/images';

type Props = {
  post: {
    title: string;
    body: string;
  };
};

export default function Page({ post }: Props) {
  return (
    <>
      <h1>{post?.title}</h1>
      <ReactMarkdown>{post?.body}</ReactMarkdown>
    </>
  );
}

export async function getStaticPaths() {
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

  const paths = arweave.map((page: any) => ({
    params: {
      id: [page],
      page: page++,
    },
  }));

  return {
    paths,
    fallback: true,
  };
}

export async function getStaticProps({ params }: any) {
  try {
    const { id } = params;
    const res = await fetch(`https://arweave.net/${id}`);
    const post = await res.json();

    const body = await unified()
      .use(remarkParse) // Parse markdown
      .use(remarkStringify) // Serialize markdown
      .process(post.text);

    return {
      props: {
        post: {
          ...post, // Pass through all post data
          body: body.toString(), // Add body to post data
        },
      },
      revalidate: 1 * 60 * 60, // refresh article contents every hour
    };
  } catch {
    return { notFound: true };
  }
}
