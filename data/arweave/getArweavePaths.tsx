export default async function getArweavePaths() {
  const {
    data: {
      transactions: { edges },
    },
  } = await fetch(`https://arweave.net/graphql`, {
    method: `POST`,
    headers: {
      'Content-Type': `application/json`,
    },
    body: JSON.stringify({
      query: `
          query fetchTransactions($addresses: [String!]!) {
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
      variables: {
        addresses: `0x429f42fB5247e3a34D88D978b7491d4b2BEe6105`,
      },
    }),
    next: {
      revalidate: 10,
    },
  }).then((res) => res.json());

  const arweavePaths = edges.map((node: any) => {
    const { id, block, tags } = node.node;
    const _tags = Object.fromEntries(
      tags.map((tag: { name: any; value: any }) => [tag.name, tag.value]),
    );

    return {
      slug: _tags[`Original-Content-Digest`],
      path: id,
      timestamp: block.timestamp,
    };
  });

  return arweavePaths;
}
