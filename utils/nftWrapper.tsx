'use client';

import { useNFT } from '@zoralabs/nft-hooks';
import Link from 'next/link';
import RemoteImage from './remoteImage';

type Props = {
  properties: {
    address: string;
    token: string;
    service: string;
  };
};

// import Link from 'next/link';

export default function NFTWrapper(props: { node: Props }) {
  const { address, token, service } = props.node.properties;

  const { data, error } = useNFT(address, token);

  if (error) {
    return <p>Error loading NFT</p>;
  }

  if (!data) {
    return <p>Loading NFT...</p>;
  }

  const src = data.media?.poster?.uri as string;
  const alt = data.metadata?.description as string;

  const nftServices = {
    zora: `https://create.zora.co/collections/${address}`,
    etherscan: `https://etherscan.io/address/${address}`,
  };

  return (
    <>
      <h3>{data.metadata?.raw?.properties.name}</h3>

      <RemoteImage src={src} alt={alt} />

      <p>
        {service == `zora` && (
          <Link href={nftServices.zora} target="_blank" rel="noreferrer">
            Zora
          </Link>
        )}
        {` `}|{` `}
        <Link href={nftServices.etherscan} target="_blank" rel="noreferrer">
          Etherscan
        </Link>
      </p>
    </>
  );
}
