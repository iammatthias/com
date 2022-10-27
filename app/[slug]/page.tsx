import { ApolloClient, InMemoryCache, gql } from "@apollo/client";
import ReactMarkdown from "react-markdown";
import arweave from "../../lib/arweave";
import uriTransformer from "../../utils/uriTransformer";

export default async function Page({ params }: { params: { slug: string }; searchParams: { id: string } }) {
  if (!params.slug) {
    return <>Loading...</>;
  }

  const post = await getPost(params.slug);

  return (
    <article>
      <h1>{post.content.title}</h1>
      <ReactMarkdown transformLinkUri={uriTransformer}>{post.content.body}</ReactMarkdown>
    </article>
  );
}

const arweaveQL = new ApolloClient({
  uri: "https://arweave.net/graphql",
  cache: new InMemoryCache(),
});

export async function generateStaticParams() {
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

  const posts = edges
    .map(({ node }: any) => {
      const tags = Object.fromEntries(node.tags.map((tag: { name: any; value: any }) => [tag.name, tag.value]));

      return { slug: tags["Original-Content-Digest"], timestamp: node.block.timestamp };
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

  return posts.map((post: { slug: any }) => ({
    slug: post.slug,
  }));
}

async function getPost(digest: string) {
  const {
    data: {
      transactions: {
        edges: {
          0: {
            node: { id: transactionId },
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
            }
          }
        }
      }
    `,
    variables: { digest },
  });

  const res = JSON.parse((await arweave.transactions.getData(transactionId, { decode: true, string: true })) as any);
  // The return value is *not* serialized
  // You can return Date, Map, Set, etc.
  return res;
}
