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
    // there might be duplicates, so we need to filter them out
    // we can use the token name for this, token.metadata.name
    const filteredTokens = tokens.nodes.filter((token: any, i: any) => {
      return tokens.nodes.findIndex((item: any) => item.token.metadata.name === token.token.metadata.name) === i;
    });
    return (
      <Suspense>
        {filteredTokens.map(({ token, i }: any) => {
          console.log(token);
          const metadata = token.metadata;
          const image = token.image.url.replace("ipfs://", "https://ipfs.io/ipfs/");

          // const image = metadata.image.replace("ipfs://", "https://ipfs.io/ipfs/");
          return (
            <>
              <Link href={`https://zora.co/collect/zora:${address}/i`} target='_blank'>
                <RemoteImage src={image} alt={metadata.name} />
              </Link>
              {metadata.description && <p>{metadata.description}</p>}
            </>
          );
        })}
      </Suspense>
    );
  }

  return <>{address}</>;
}
