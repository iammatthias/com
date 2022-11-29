import getArweaveEntries from './arweave/getArweaveEntries';
import getObsidianEntries from './obsidian/getObsidianEntries';

export default async function getUnifiedEntries() {
  const arweaveEntries = await getArweaveEntries();
  const obsidianEntries = await getObsidianEntries();

  const _arweaveEntries = await Promise.all(arweaveEntries);
  const _obsidianEntries = await Promise.all(obsidianEntries);

  const entries = [..._arweaveEntries, ..._obsidianEntries];

  const sortedEntries = entries.sort((a: any, b: any) => {
    return b.timestamp - a.timestamp;
  });

  return sortedEntries;
}
