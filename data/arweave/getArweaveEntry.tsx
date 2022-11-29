import arweave from '../../lib/arweave';
import formatEntry from '../formatEntry';

export default async function getArweaveEntry(digest: string) {
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
  } = await fetch(`https://arweave.net/graphql`, {
    method: `POST`,
    headers: {
      'Content-Type': `application/json`,
    },
    body: JSON.stringify({
      query: `
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
      variables: {
        digest,
      },
    }),
    next: {
      revalidate: 10,
    },
  }).then((res) => res.json());

  return formatEntry(
    JSON.parse(
      (await arweave.transactions.getData(transactionId, {
        decode: true,
        string: true,
      })) as any,
    ),
    transactionId,
    timestamp,
  );
}
