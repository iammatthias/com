import NextImage from 'next/image';
import imageSize from 'image-size';
import axios from 'axios';
import IFrame from './iFrame';

function Image(props: any) {
  const uri = `https://pub-8bcf4a42832e4273a5a34c696ccc1b55.r2.dev/${props.src}`;

  const image = axios.get(uri, { responseType: 'arraybuffer' }).then((response) => {
    const dimensions = imageSize(response.data);
    return (
      <figure style={{ position: `relative` }}>
        <NextImage
          src={uri}
          alt={props.alt}
          width={dimensions.width}
          height={dimensions.height}
          style={{ objectFit: `contain`, height: `fit-content` }}
        />
        {props.alt && <figcaption>{props.alt}</figcaption>}
      </figure>
    );
  });

  return image;
}

function Frame(props: any) {
  const uri = `${props.src}/frame?padding=20px&showDetails=false&theme=light&showPresale=true&showMedia=true&showCollectors=false`;

  return <IFrame src={uri} />;
}

function Block(props: any) {
  const block = props.children.map((child: any) => {
    if (child.type) {
      return child;
    } else {
      return <p>{child}</p>;
    }
  });

  return block;
}

export const components = {
  image: Image,
  iframe: Frame,
  paragraph: Block,
};
