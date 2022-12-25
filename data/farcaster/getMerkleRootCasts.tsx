export default async function getMerkleRoot(merkleRoot: string) {
  const uri = `https://searchcaster.xyz/api/search?merkleRoot=${merkleRoot}`;
  const res = await fetch(uri, {
    next: {
      revalidate: 1 * 30,
    },
  }).then((res) => res.json());
  const casts = res.casts;
  return casts;
}
