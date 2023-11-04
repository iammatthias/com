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
        <Link href={`https://zora.co/collect/zora:${address}`} target='_blank'>
          <RemoteImage src={image} alt={metadata.name} />
        </Link>
        {metadata.description && <p>{metadata.description}</p>}
      </Suspense>
    );
  } else if (tokenStandard === "ERC1155") {
    const filteredTokens = tokens.nodes.filter((token: any, i: any) => {
      return tokens.nodes.findIndex((item: any) => item.token.metadata.name === token.token.metadata.name) === i;
    });
    return filteredTokens.map(({ token }: any) => {
      const name = token.name;
      const description = token.description;
      const image = token.image.url.replace("ipfs://", "https://ipfs.io/ipfs/");
      const tokenId = token.tokenId;

      return (
        <Suspense key={tokenId}>
          <Link href={`https://zora.co/collect/zora:${address}/${tokenId}`} target='_blank'>
            <RemoteImage src={image} alt={name} />
          </Link>
          {description && <p>{description}</p>}
        </Suspense>
      );
    });
  }

  return <>{address}</>;
}
