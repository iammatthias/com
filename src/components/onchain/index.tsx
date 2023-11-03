import Link from "next/link";
import RemoteImage from "../remote_image";
import { Suspense } from "react";
import { getOnchainData } from "@/lib/zora";

export default async function Onchain({ address }: { address: string }) {
  const data = await getOnchainData(address);

  const { collections, tokens } = data.data;

  const tokenStandard = collections.nodes[0].tokenStandard;

  if (tokenStandard === "ERC721") {
    const metadata = tokens.nodes[0].token.metadata;
    const image = tokens.nodes[0].token.image.url.replace("ipfs://", "https://ipfs.io/ipfs/");

    return (
      <Suspense>
        <Link href={`https://zora.co/collect/zora:${address}`}>
          <RemoteImage src={image} alt={metadata.name} />
        </Link>
        <p>{metadata.description}</p>
      </Suspense>
    );
  } else if (tokenStandard === "ERC1155") {
    return (
      <Suspense>
        {tokens.nodes.map(({ token, i }: any) => {
          console.log(token);
          const metadata = token.metadata;
          const image = token.image.url.replace("ipfs://", "https://ipfs.io/ipfs/");

          // const image = metadata.image.replace("ipfs://", "https://ipfs.io/ipfs/");
          return (
            <>
              <Link href={`https://zora.co/collect/zora:${address}/i`}>
                <RemoteImage src={image} alt={metadata.name} />
              </Link>
              <p>{metadata.description}</p>
            </>
          );
        })}
      </Suspense>
    );
  }

  return <>{address}</>;
}
