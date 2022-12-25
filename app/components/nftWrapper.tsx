'use client';

import { useNFT } from '@zoralabs/nft-hooks';
import Link from 'next/link';
import RemoteImage from '../../utils/remoteImage';
import components from './components.module.css';

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

  console.log(data.media);

  const src = data.media?.large?.uri as string;
  const alt = data.metadata?.description as string;

  const nftServices = {
    zora: `https://create.zora.co/collections/${address}`,
    etherscan: `https://etherscan.io/address/${address}`,
  };

  return (
    <div className={`${components.nftWrapper}`}>
      <RemoteImage src={src} alt={alt} />

      <h3>{data.metadata?.raw?.properties.name}</h3>

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
    </div>
  );
}
