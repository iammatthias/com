import RemoteImage from "@/ui/remoteImage";
import { Agent } from "@zoralabs/nft-metadata";
import Link from "next/link";
import { Suspense } from "react";

import styles from "./token.module.scss";
import Button from "./button";

const parser = new Agent({
  // Use ethers.js Networkish here: numbers (1/4) or strings (homestead/rinkeby) work here
  network: "homestead",
  // RPC url to access blockchain with. Optional: will fallback to using cloudflare eth
  networkUrl:
    "https://rpc.ankr.com/eth" ||
    "https://ethereum.publicnode.com" ||
    "https://cloudflare-eth.com",
  // IPFS gateway
  ipfsGatewayUrl:
    "https://ipfs.io" ||
    "https://gateway.ipfs.io" ||
    "https://cloudflare-ipfs.com",
});

export default function Token(props: {
  address: string;
  token: string;
  showMeta?: boolean;
}) {
  const metadata = parser
    .fetchMetadata(props.address, props.token)
    .then((data) => {
      const imgURL = data.metadata.image;
      const contentURL = data.contentURL;
      const contentURLMimeType = data.contentURLMimeType;
      const name = data.name;
      const description = data.description;

      return (
        <>
          <Suspense>
            {contentURLMimeType == "video/mp4" ? (
              <video
                src={contentURL}
                autoPlay
                loop
                muted
                playsInline
                controls={false}
                width='100%'
                height='100%'
                poster={imgURL}
              />
            ) : (
              <RemoteImage
                {...props}
                src={contentURL}
                alt={
                  data.metadata.name
                    ? data.metadata.name
                    : data.metadata.properties.name
                }
              />
            )}
            {props.showMeta && (
              <div className={`${styles.artMeta}`}>
                <h5>{name}</h5>
                <p>{description}</p>

                <Link
                  // href={`https://etherscan.io/nft/${props.address}/${props.token}`}
                  href={`https://opensea.io/assets/${props.address}/${props.token}`}
                  // href={`https://zora.co/collections/${props.address}/${props.token}`}
                  target='_blank'>
                  <Button>View on Opensea ⇝</Button>
                </Link>
              </div>
            )}
          </Suspense>
        </>
      );
    });

  return metadata;
}
