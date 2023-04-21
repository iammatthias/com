interface Tag {
  name: string;
  value: string;
}

interface Node {
  id: string;
  block: {
    timestamp: number;
  };
  tags: Tag[];
}

interface Edge {
  node: Node;
}

interface TransactionsData {
  transactions: {
    edges: Edge[];
  };
}

interface ApiResponse {
  data: TransactionsData;
}

export default function fetchArweaveEntries() {
  return fetch(`https://arweave.net/graphql`, {
    method: `POST`,
    headers: {
      "Content-Type": `application/json`,
    },
    body: JSON.stringify({
      query: `
              query fetchTransactions($addresses: [String!]!) {
                transactions(first: 100, tags: [{ name: "AppName", values: ["Paragraph"]}, { name: "PublicationId", values: ["yLwkwLgaQQKgRyKdIsIn"]}, { name: "Contributor", values: $addresses }]) {
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
      variables: {
        addresses: `0x429f42fB5247e3a34D88D978b7491d4b2BEe6105`,
      },
    }),
  })
    .then((res) => res.json())
    .then(async (response: ApiResponse) => {
      const {
        data: {
          transactions: { edges },
        },
      } = response;

      const sortedEdges = edges.sort((a: Edge, b: Edge) => {
        const aTimestamp = a.node.block.timestamp;
        const bTimestamp = b.node.block.timestamp;
        return bTimestamp - aTimestamp;
      });

      const uniqueEdges = sortedEdges.reduce(
        (acc: Record<string, Edge>, edge: Edge) => {
          const { tags } = edge.node;
          const _tags = Object.fromEntries(
            tags.map((tag: Tag) => [tag.name, tag.value])
          );
          const postSlug = _tags.PostSlug;
          if (!acc[postSlug]) {
            acc[postSlug] = edge;
          }
          return acc;
        },
        {}
      );

      const uniqueEdgesArray = Object.values(uniqueEdges);

      const arweaveEntries = await Promise.all(
        uniqueEdgesArray.map(async (node: Edge) => {
          const { id } = node.node;

          return {
            path: id,
          };
        })
      );

      return arweaveEntries;
    });
}
