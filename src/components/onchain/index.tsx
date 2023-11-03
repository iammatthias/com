import Link from "next/link";
import RemoteImage from "../remote_image";

// Decode base64 data
function decodeBase64Json(base64Str: string) {
  const jsonStr = Buffer.from(base64Str, "base64").toString();
  return JSON.parse(jsonStr);
}

async function fetchContractURI(address: string) {
  const response = await fetch(`https://explorer.zora.energy/api/v2/smart-contracts/${address}/query-read-method`, {
    method: "POST",
    headers: {
      accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      args: [],
      method_id: "e8a3d485",
      from: address,
      contract_type: "proxy",
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  return data.result.output[0].value.replace("ipfs://", "");
}

async function fetchMetadata(hash: string) {
  // Check if the hash is a base64-encoded data object
  if (hash.startsWith("data:")) {
    // Extract the base64 part and decode it
    const base64Data = hash.split(",")[1];
    const jsonStr = atob(base64Data);
    return JSON.parse(jsonStr);
  } else {
    // It's an IPFS hash, proceed with existing logic
    const gateways = [
      "https://ipfs.io/ipfs/",
      "https://gateway.pinata.cloud/ipfs/",
      "https://gateway.ipfs.io/ipfs/",
      "https://cf-ipfs.com/ipfs/",
    ];

    for (const gateway of gateways) {
      try {
        const response = await fetch(`${gateway}${hash}`);
        if (response.ok) {
          return response.json();
        }
      } catch (error) {
        console.error(`Error with ${gateway}:`, error);
      }
    }
  }

  throw new Error(`All IPFS gateways failed for hash: ${hash}`);
}

async function fetchNextTokenID(address: string) {
  const response = await fetch(`https://explorer.zora.energy/api/v2/smart-contracts/${address}/query-read-method`, {
    method: "POST",
    headers: {
      accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      args: [],
      method_id: "75794a3c",
      from: address,
      contract_type: "proxy",
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  return parseInt(data.result.output[0].value);
}

async function fetchTokenData(address: string, tokenId: number) {
  const response = await fetch(`https://explorer.zora.energy/api/v2/smart-contracts/${address}/query-read-method`, {
    method: "POST",
    headers: {
      accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      args: [tokenId.toString()],
      method_id: "0e89341c",
      contract_type: "proxy",
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  return data.result.output[0].value.replace("ipfs://", "");
}

export async function fetchAllTokenMetadata(address: string, nextTokenID: number) {
  const tokenMetadataArray = [];
  for (let i = 1; i < nextTokenID; i++) {
    const tokenURIHash = await fetchTokenData(address, i);
    const tokenMetadata = await fetchMetadata(tokenURIHash);
    console.log(tokenMetadata);
    tokenMetadataArray.push(tokenMetadata);
  }
  return tokenMetadataArray;
}

// export default async function Onchain({ address }: { address: string }) {
//   try {
//     const contractURI = await fetchContractURI(address);
//     console.log("contractURI", contractURI);
//     const contractMetadata = await fetchMetadata(contractURI);
//     // console.log(contractMetadata);
//     const contractMetadataDescription = contractMetadata.description;
//     const nextTokenID = await fetchNextTokenID(address);

//     const tokenMetadataArray = await fetchAllTokenMetadata(address, nextTokenID);

//     return (
//       <>
//         <p>{contractMetadataDescription}</p>
//         {tokenMetadataArray.map((tokenMetadata, i) => (
//           <>
//             <Link href={`https://zora.co/collect/zora:${address}/${i + 1}`}>
//               <RemoteImage
//                 src={tokenMetadata.image.replace("ipfs://", "https://ipfs.io/ipfs/")}
//                 alt={tokenMetadata.name}
//               />
//             </Link>
//             <p>{tokenMetadata.description}</p>
//           </>
//         ))}
//       </>
//     );
//   } catch (error) {
//     console.error("Error:", error);
//     return (
//       <>
//         <p>Error fetching data for address: {address}</p>
//       </>
//     );
//   }
// }

export default async function Onchain({ address }: { address: string }) {
  try {
    const contractURI = await fetchContractURI(address);
    let contractMetadata;
    let tokenMetadataArray = [];

    if (contractURI.startsWith("data:")) {
      // URI is base64 JSON data
      const base64Data = contractURI.split(",")[1];
      contractMetadata = decodeBase64Json(base64Data);
      console.log(contractMetadata);
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
            <>
              <Link href={`https://zora.co/collect/zora:${address}/${i + 1}`}>
                <RemoteImage
                  src={tokenMetadata.image.replace("ipfs://", "https://ipfs.io/ipfs/")}
                  alt={tokenMetadata.name}
                />
              </Link>
              <p>{tokenMetadata.description}</p>
            </>
          ))}
        </>
      );
    }

    // Render or return the contract and token metadata
    // The rest of your component logic will go here...
  } catch (error) {
    console.error("Error:", error);
    return (
      <>
        <p>Error fetching data for address: {address}</p>
      </>
    );
  }
}
