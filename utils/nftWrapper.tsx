'use client';

import { useNFT } from '@zoralabs/nft-hooks';
import RemoteImage from './remoteImage';

// import Link from 'next/link';

export default function NFTWrapper(props: any) {
  const { dataAddress, dataToken } = props.node.properties;

  const { data, error } = useNFT(dataAddress, dataToken);

  if (error) {
    console.log(`error`, error);
    return <p>Error loading NFT</p>;
  }

  if (!data) {
    return <p>Loading NFT...</p>;
  }

  const src = data.media?.poster?.uri as any;
  const alt = data.metadata?.description as any;

  return (
    <>
      <h3>{data.metadata?.raw?.properties.name}</h3>

      <RemoteImage src={src} />

      <p>{alt}</p>
    </>
  );
}
