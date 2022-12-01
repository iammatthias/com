export default async function getTopLevelCasts(slug: string) {
  const uri =
    `https://searchcaster.xyz/api/search?text=iammatthias.com/` +
    (`arweave/` || `md/`) +
    slug;
  const res = await fetch(uri, {
    next: {
      revalidate: 1 * 30,
    },
  }).then((res) => res.json());
  const casts = res.casts;
  return casts;
}
