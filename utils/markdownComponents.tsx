import IFrame from './iFrame';
import NFTWrapper from './nftWrapper';
import RemoteImage from './remoteImage';

function Frame(props: any) {
  const uri = `${props.src}/frame?padding=0px&mediaPadding=20px&showDetails=false&theme=light&showMedia=true&showCollectors=false&showMintingUI=false`;

  return <IFrame src={uri} _src={props.src} />;
}

function NFT(props: any) {
  return <NFTWrapper {...props} />;
}

function Div(props: any) {
  const { node } = props;

  if (node.properties.type === `nft`) {
    return <NFTWrapper {...props} />;
  }
  return <div {...props}>{props.children}</div>;
}

function Paragraph(props: any) {
  const { node } = props;

  if (node.children[0].tagName === `img`) {
    const image = node.children[0];
    const src = `https://pub-8bcf4a42832e4273a5a34c696ccc1b55.r2.dev/${image.properties.src}`;
    const alt = image.properties.alt;

    return <RemoteImage src={src} alt={alt} />;
  }
  return <p>{props.children}</p>;
}

export const components = {
  iframe: Frame,
  nft: NFT,
  paragraph: Paragraph,
  div: Div,
};
