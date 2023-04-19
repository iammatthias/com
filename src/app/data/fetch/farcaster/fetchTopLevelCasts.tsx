export default async function fetchTopLevelCasts(slug: string) {
  const uri = `https://searchcaster.xyz/api/search?text=${slug}`;

  const res = await fetch(uri, {
    next: {
      revalidate: 5 * 60,
    },
  }).then((res) => res.json());
  const casts = res.casts;
  return casts;
}
