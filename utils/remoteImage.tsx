'use client';

import NextImage from 'next/image';
import { useImageSize } from 'react-image-size';

export default function RemoteImage(props: any) {
  const { src, alt, caption } = props;

  const [data, { loading, error }] = useImageSize(src);

  if (loading) {
    return <p>Loading...</p>;
  }

  if (error) {
    return <p>Error loading image</p>;
  }

  if (data) {
    return (
      <figure style={{ position: `relative` }}>
        <NextImage
          priority
          src={src}
          alt={alt}
          width={data.width}
          height={data.height}
          style={{
            objectFit: `contain`,
            height: `fit-content`,
            width: `100%`,
          }}
        />
        {alt && <figcaption>{caption}</figcaption>}
      </figure>
    );
  }
  return null;
}
