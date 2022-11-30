export default async function getTopLevelCasts(slug: string) {
  const searchString =
    `portfolio.iammatthias.com/` + (`arweave` || `md`) + `/` + slug;

  console.log('searchString', searchString);

  const uri = `https://searchcaster.xyz/api/search?text=${searchString}`;

  console.log('uri', uri);

  const res = await fetch(uri).then((res) => res.json());

  const casts = res.casts;

  return casts;
}
