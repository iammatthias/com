import slug from 'slug';
import arweave from '@/lib/arweave';
import { arweaveQL } from '@/lib/graphql';
import fetchSingleTransaction from '@/queries/fetchSingleTransaction';
import fetchTransactions from '@/queries/fetchTransactions';
import { calculateSizes } from '@/utils/images';

const formatEntry = async (
  entry: {
    content: { title: string; body: string };
    originalDigest: any;
    digest: any;
    authorship: { contributor: any };
  },
  transactionId: any,
  timestamp: any,
) => ({
  title: entry.content.title,
  slug: slug(entry.content.title),
  body: entry.content.body,
  timestamp,
  digest: entry.originalDigest ?? entry.digest,
  contributor: entry.authorship.contributor,
  transaction: transactionId,
  cover_image:
    (entry.content.body
      .split(`\n\n`)[0]
      .match(/!\[[^\]]*\]\((.*?)\s*("(?:.*[^"])")?\s*\)/m) || [])?.[1] || null,
  image_sizes: await calculateSizes(entry.content.body),
});

export const getEntryPaths = async () => {
  const {
    data: {
      transactions: { edges },
    },
  } = await arweaveQL.query({
    query: fetchTransactions,
    variables: { addresses: `0x429f42fB5247e3a34D88D978b7491d4b2BEe6105` },
  });

  return edges
    .map(({ node }: any) => {
      const tags = Object.fromEntries(
        node.tags.map((tag: { name: any; value: any }) => [
          tag.name,
          tag.value,
        ]),
      );

      return {
        slug: tags[`Original-Content-Digest`],
        path: node.id,
        timestamp: node.block.timestamp,
      };
    })
    .filter((entry: { slug: string }) => entry.slug && entry.slug !== ``)
    .reduce((acc: any[], current: { slug: any; timestamp: any }) => {
      const x = acc.findIndex(
        (entry: { slug: any }) => entry.slug === current.slug,
      );
      if (x == -1) return acc.concat([current]);
      else {
        acc[x].timestamp = current.timestamp;

        return acc;
      }
    }, []);
};

export const getEntries = async () => {
  const paths = await getEntryPaths();

  return (
    await Promise.all(
      paths.map(async (entry: { path: string; slug: any; timestamp: any }) =>
        formatEntry(
          JSON.parse(
            (await arweave.transactions.getData(entry.path, {
              decode: true,
              string: true,
            })) as any,
          ),
          entry.slug,
          entry.timestamp,
        ),
      ),
    )
  )
    .sort((a, b) => b.timestamp - a.timestamp)
    .reduce((acc, current) => {
      const x = acc.find((entry: { slug: any }) => entry.slug === current.slug);
      if (!x) return acc.concat([current]);
      else return acc;
    }, []);
};

export const getEntry = async (digest: any) => {
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
    query: fetchSingleTransaction,
    variables: { digest },
  });

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
};
