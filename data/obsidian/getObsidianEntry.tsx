import getObsidianEntries from './getObsidianEntries';

export default async function getObsidianEntry(slug: any) {
  const paths = await getObsidianEntries();
  const _paths = await Promise.all(paths);

  const entry = _paths.find((entry: any) => entry.slug === slug);

  return entry;
}
