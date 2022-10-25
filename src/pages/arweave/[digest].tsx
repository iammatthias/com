// dynamic route
// get the most recent version of a Mirror post from Arweave GraphQL using the `Original-Content-Digest` sorted by block number

import { arweaveQL } from "@/lib/graphql";
import { gql } from "@apollo/client";
import ReactMarkdown from "react-markdown";

import arweave from "@/lib/arweave";
import uriTransformer from "@/utils/uriTransformer";

type Props = {
  title: string;
  body: string;
};

export default function Digest({ title, body }: Props) {
  return (
    <div>
      <h1>{title}</h1>
      <ReactMarkdown transformLinkUri={uriTransformer}>{body}</ReactMarkdown>
    </div>
  );
}

export async function getStaticPaths() {
  const {
    data: {
      transactions: { edges },
    },
  } = await arweaveQL.query({
    query: gql`
      query FetchTransactions($addresses: [String!]!) {
        transactions(first: 100, tags: [{ name: "App-Name", values: ["MirrorXYZ"] }, { name: "Contributor", values: $addresses }]) {
          edges {
            node {
              id
              block {
                timestamp
              }
              tags {
                name
                value
              }
            }
          }
        }
      }
    `,
    variables: { addresses: `0x429f42fB5247e3a34D88D978b7491d4b2BEe6105` },
  });

  const _paths = edges
    .map(({ node }: any) => {
      const tags = Object.fromEntries(node.tags.map((tag: { name: any; value: any }) => [tag.name, tag.value]));

      return { slug: tags["Original-Content-Digest"], path: node.id, timestamp: node.block.timestamp };
    })
    .filter((entry: { slug: string }) => entry.slug && entry.slug !== "")
    .reduce((acc: any[], current: { slug: any; timestamp: any }) => {
      const x = acc.findIndex((entry: { slug: any }) => entry.slug === current.slug);
      if (x == -1) return acc.concat([current]);
      else {
        acc[x].timestamp = current.timestamp;

        return acc;
      }
    }, []);

  return {
    paths: _paths.map((path: { slug: any }) => ({ params: { digest: path.slug } })),
    fallback: true,
  };
}

export async function getStaticProps({ params: { digest } }: any) {
  const {
    data: {
      transactions: {
        edges: {
          0: {
            node: {
              id: transactionId,
              block: { timestamp },
            },
          },
        },
      },
    },
  } = await arweaveQL.query({
    query: gql`
      query FetchTransaction($digest: String!) {
        transactions(tags: [{ name: "Original-Content-Digest", values: [$digest] }, { name: "App-Name", values: "MirrorXYZ" }]) {
          edges {
            node {
              id
              block {
                timestamp
              }
            }
          }
        }
      }
    `,
    variables: { digest },
  });

  const entry = JSON.parse((await arweave.transactions.getData(transactionId, { decode: true, string: true })) as any);

  console.log(entry);

  return {
    props: {
      title: entry.content.title,
      body: entry.content.body,
      timestamp,
      digest: entry.originalDigest ?? entry.digest,
      contributor: entry.authorship.contributor,
      transaction: transactionId,
      cover_image: (entry.content.body.split("\n\n")[0].match(/!\[[^\]]*\]\((.*?)\s*("(?:.*[^"])")?\s*\)/m) || [])?.[1] || null,
    },
  };
}
