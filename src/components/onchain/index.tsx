import Link from "next/link";
import RemoteImage from "../remote_image";
import { Suspense } from "react";
import { getOnchainData } from "@/lib/zora";

interface TokenMetadata {
  name: string;
  description?: string;
  image: string;
  animation_url?: string;
  content?: {
    mime: string;
  };
}

interface Token {
  tokenId: string;
  token: {
    metadata: TokenMetadata;
  };
}

interface OnchainProps {
  address: string;
}

const replaceIpfsUrl = (url: string) => {
  return url.replace("ipfs://", "https://silver-bitter-junglefowl-364.mypinata.cloud/ipfs/");
};

const TokenRenderer = ({ token, address }: { token: Token; address: string }) => {
  const { metadata } = token.token;

  const image = replaceIpfsUrl(metadata.image);
  const imageSrc = `https://wsrv.nl/?w=10&dpr=2&n=-1&url=${image}`;
  const video = metadata.animation_url ? replaceIpfsUrl(metadata.animation_url) : undefined;

  return (
    <Suspense key={token.tokenId} fallback={<div>Loading...</div>}>
      <Link
        href={`https://zora.co/collect/zora:${address}/${token.tokenId}?referrer=0x429f42fB5247e3a34D88D978b7491d4b2BEe6105`}
        target='_blank'>
        {metadata.content?.mime === "video/mp4" ? (
          <video autoPlay muted playsInline poster={imageSrc} preload='none'>
            <source src={video} type={metadata.content.mime} />
          </video>
        ) : (
          <RemoteImage src={image} alt={metadata.name} />
        )}
      </Link>
      {metadata.description && <p>{metadata.description}</p>}
    </Suspense>
  );
};

export default async function Onchain({ address }: OnchainProps) {
  try {
    const data = await getOnchainData(address);
    const { collections, tokens } = data.data;

    const tokenStandard = collections.nodes[0].tokenStandard;

    if (tokenStandard === "ERC721") {
      // Render only the first token for ERC721
      return <TokenRenderer token={tokens.nodes[0]} address={address} />;
    } else {
      // Render all tokens for ERC1155
      return tokens.nodes.map((token: Token) => <TokenRenderer key={token.tokenId} token={token} address={address} />);
    }
  } catch (error) {
    console.error("Error fetching on-chain data:", error);
    return <div>Error loading data</div>;
  }
}
