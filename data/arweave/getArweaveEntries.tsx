import arweave from '../../lib/arweave';
import formatEntry from '../formatEntry';
import getArweavePaths from './getArweavePaths';

export default async function getArweaveEntries() {
  const paths = await getArweavePaths();

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
}
