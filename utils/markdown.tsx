import NextImage from 'next/image';
import imageSize from 'image-size';
import axios from 'axios';
import IFrame from './iFrame';

function Frame(props: any) {
  const uri = `${props.src}/frame?padding=0px&mediaPadding=20px&showDetails=false&theme=light&showMedia=true&showCollectors=false&showMintingUI=false`;

  return <IFrame src={uri} _src={props.src} />;
}

function Paragraph(props: any) {
  const { node } = props;

  if (node.children[0].tagName === `img`) {
    const image = node.children[0];
    const src = `https://pub-8bcf4a42832e4273a5a34c696ccc1b55.r2.dev/${image.properties.src}`;
    const alt = image.properties.alt;

    const renderImage = axios
      .get(src, { responseType: `arraybuffer` })
      .then((response) => {
        const dimensions = imageSize(response.data);
        return (
          <figure style={{ position: `relative` }}>
            <NextImage
              priority
              src={src}
              alt={alt}
              width={dimensions.width}
              height={dimensions.height}
              style={{
                objectFit: `contain`,
                height: `fit-content`,
                width: `100%`,
              }}
            />
            {alt && <figcaption>{alt}</figcaption>}
          </figure>
        );
      });

    return renderImage;
  }
  return <p>{props.children}</p>;
}

export const components = {
  // image: Image,
  iframe: Frame,
  paragraph: Paragraph,
};
