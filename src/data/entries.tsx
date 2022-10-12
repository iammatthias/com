import slug from 'slug';
import arweave from '@/lib/arweave';
import { arweaveQL } from '@/lib/graphql';
import fetchSingleTransaction from '@/queries/fetchSingleTransaction';
import fetchTransactions from '@/queries/fetchTransactions';
import { calculateSizes } from '@/utils/images';
// import { getConfig } from '@/hooks/getConfig'

export const getEntryPaths = async () => {
  const {
    data: {
      transactions: { edges },
    },
  } = await arweaveQL.query({
    query: fetchTransactions,
    variables: { addresses: [`0x429f42fB5247e3a34D88D978b7491d4b2BEe6105`] },
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
        slug: tags[`PostSlug`],
        id: tags[`PostId`],
        tx: node.id,
        timestamp: node.block.timestamp,
      };
    })
    .filter((entry: { id: string }) => entry.id && entry.id !== ``)
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
      paths.map(async (entry: any) =>
        formatEntry(
          JSON.parse(
            (await arweave.transactions.getData(entry.tx, {
              decode: true,
              string: true,
            })) as string,
          ),
        ),
      ),
    )
  )
    .sort((a, b) => b.timestamp - a.timestamp)
    .reduce((acc, current) => {
      const x = acc.find((entry: any) => entry.slug === current.slug);
      if (!x) return acc.concat([current]);
      else return acc;
    }, []);
};

export const getEntry = async (postId: any) => {
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
    query: fetchSingleTransaction,
    variables: { postId },
  });

  console.log(transactionId);

  return formatEntry(
    JSON.parse(
      (await arweave.transactions.getData(transactionId, {
        decode: true,
        string: true,
      })) as string,
    ),
  );
};

const formatEntry = async (entry: any) => ({
  title: entry.title,
  slug: slug(entry.title),
  body: entry.text,
  timestamp: entry.publishedAt,
  postId: entry.id,
  transaction: entry.arweaveId,
  cover_image:
    (entry.text
      .split(`\n\n`)[0]
      .match(/!\[[^\]]*\]\((.*?)\s*("(?:.*[^"])")?\s*\)/m) || [])?.[1] || null,
  image_sizes: await calculateSizes(entry.text),
});
