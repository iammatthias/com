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

  const src = data.rawData.APIIndexer.image.mediaEncoding.original as string;
  const title = data.rawData.APIIndexer.tokenContract.name as string;
  const alt = data.rawData.APIIndexer.description as string;

  const nftServices = {
    zora: `https://create.zora.co/collections/${address}`,
    mint: `https://mint.fun/${address}/`,
    etherscan: `https://etherscan.io/address/${address}`,
  };

  return (
    <div className={`${components.nftWrapper}`}>
      <RemoteImage src={src} alt={alt} />

      <h3>{title}</h3>

      {/* <p>{alt}</p> */}

      <p>
        {service == `zora` && (
          <Link href={nftServices.zora} target="_blank" rel="noreferrer">
            Zora
          </Link>
        )}
        {` `}|{` `}
        <Link href={nftServices.mint} target="_blank" rel="noreferrer">
          Mint.fun
        </Link>
        {` `}|{` `}
        <Link href={nftServices.etherscan} target="_blank" rel="noreferrer">
          Etherscan
        </Link>
      </p>
    </div>
  );
}
