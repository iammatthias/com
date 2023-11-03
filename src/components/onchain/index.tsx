import Link from "next/link";
import RemoteImage from "../remote_image";
import { Suspense } from "react";

// Helper function to make API requests
async function makeApiRequest(url: string, body: any) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      accept: "application/json",
      "Content-Type": "application/json",
    },
    next: {
      revalidate: 1 * 30,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
}

// Decode base64 data
function decodeBase64Json(base64Str: string) {
  const jsonStr = Buffer.from(base64Str, "base64").toString();
  return JSON.parse(jsonStr);
}

// Fetch functions use the helper to reduce repeated code
async function fetchContractURI(address: string) {
  const data = await makeApiRequest(
    `https://explorer.zora.energy/api/v2/smart-contracts/${address}/query-read-method`,
    {
      args: [],
      method_id: "e8a3d485",
      from: address,
      contract_type: "proxy",
    }
  );

  return data.result.output[0].value.replace("ipfs://", "");
}

async function fetchNextTokenID(address: string) {
  const data = await makeApiRequest(
    `https://explorer.zora.energy/api/v2/smart-contracts/${address}/query-read-method`,
    {
      args: [],
      method_id: "75794a3c",
      from: address,
      contract_type: "proxy",
    }
  );

  return parseInt(data.result.output[0].value);
}

async function fetchTokenData(address: string, tokenId: number) {
  const data = await makeApiRequest(
    `https://explorer.zora.energy/api/v2/smart-contracts/${address}/query-read-method`,
    {
      args: [tokenId.toString()],
      method_id: "0e89341c",
      from: address,
      contract_type: "proxy",
    }
  );

  return data.result.output[0].value.replace("ipfs://", "");
}

async function fetchMetadata(hash: string) {
  // Use only the primary IPFS gateway
  if (hash.startsWith("data:")) {
    const base64Data = hash.split(",")[1];
    return decodeBase64Json(base64Data);
  } else {
    // Remove loop, use a single IPFS gateway
    const response = await fetch(`https://ipfs.io/ipfs/${hash}`);
    if (!response.ok) {
      throw new Error(`Error with IPFS gateway: ${response.statusText}`);
    }
    return response.json();
  }
}

// Optimized function to fetch all token metadata in parallel
export async function fetchAllTokenMetadata(address: string, nextTokenID: number) {
  const promises = Array.from({ length: nextTokenID - 1 }, (_, i) =>
    fetchTokenData(address, i + 1)
      .then(fetchMetadata)
      .catch((error) => console.error(`Token ${i + 1} fetch error:`, error))
  );

  const results = await Promise.allSettled(promises);
  return results.filter((r) => r.status === "fulfilled").map((r: any) => r.value);
}

export default async function Onchain({ address }: { address: string }) {
  try {
    const contractURI = await fetchContractURI(address);
    let contractMetadata;
    let tokenMetadataArray = [];

    if (contractURI.startsWith("data:")) {
      // URI is base64 JSON data
      const base64Data = contractURI.split(",")[1];
      contractMetadata = decodeBase64Json(base64Data);
      return (
        <>
          <Link href={`https://zora.co/collect/zora:${address}`}>
            <RemoteImage
              src={contractMetadata.image.replace("ipfs://", "https://ipfs.io/ipfs/")}
              alt={contractMetadata.name}
            />
          </Link>
          <p>{contractMetadata.description}</p>
        </>
      );
    } else {
      // URI is an IPFS link or other type
      contractMetadata = await fetchMetadata(contractURI);
      const contractMetadataDescription = contractMetadata.description;
      const nextTokenID = await fetchNextTokenID(address);
      tokenMetadataArray = await fetchAllTokenMetadata(address, nextTokenID);
      return (
        <>
          <p>{contractMetadataDescription}</p>
          {tokenMetadataArray.map((tokenMetadata, i) => (
            <Suspense key={i}>
              <Link href={`https://zora.co/collect/zora:${address}/${i + 1}`}>
                <RemoteImage
                  src={tokenMetadata.image.replace("ipfs://", "https://ipfs.io/ipfs/")}
                  alt={tokenMetadata.name}
                />
              </Link>
              <p>{tokenMetadata.description}</p>
            </Suspense>
          ))}
        </>
      );
    }
  } catch (error) {
    console.error("Error:", error);
    return (
      <>
        <p>Error fetching data for address: {address}</p>
      </>
    );
  }
}
