import { RequestInfo } from "undici-types";

const BASE_URL = "https://searchcaster.xyz/api/search";

// Existing helper function to fetch casts
async function fetchCasts(uri: RequestInfo) {
  try {
    const response = await fetch(uri, {
      next: {
        revalidate: 1 * 30,
      },
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return (await response.json()).casts;
  } catch (error) {
    console.error("Fetch error:", error);
    throw error;
  }
}

// New helper function to get cast threads
export async function getCastThreads(slug: string) {
  const topLevelCasts = await getTopLevelCasts(slug);
  const castsWithChildren = await Promise.all(
    topLevelCasts.map(async (cast: any) => {
      const children = cast.meta.numReplyChildren > 0 ? await getCastsByMerkleRoot(cast.merkleRoot) : [];
      return { ...cast, children };
    })
  );
  return castsWithChildren;
}

// Function to get top level casts by slug
async function getTopLevelCasts(slug: string) {
  const uri = `${BASE_URL}?text=iammatthias.com/post/${slug}`;
  return fetchCasts(uri);
}

// Function to get cast by Merkle root
async function getCastsByMerkleRoot(merkleRoot: any) {
  const uri = `${BASE_URL}?merkleRoot=${merkleRoot}`;
  return fetchCasts(uri);
}
