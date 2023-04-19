export default async function fetchMerkleRootCasts(merkleRoot: string) {
  try {
    const res = await fetch(
      `https://searchcaster.xyz/api/search?merkleRoot=${merkleRoot}`
    );
    const data = await res.json();
    return data;
  } catch (error) {
    console.error("Error fetching Merkle root:", error);
    return [];
  }
}
