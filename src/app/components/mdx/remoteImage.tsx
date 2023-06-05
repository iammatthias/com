"use client";

import { Suspense } from "react";
import NextImage from "next/image";
import { useImageSize } from "react-image-size";

export default function RemoteImage(props: any) {
  const { src, alt, caption } = props;

  const [data, { loading, error }] = useImageSize(src);

  if (loading) {
    return (
      <div className='loading'>
        <p>≋</p>
      </div>
    );
  }

  if (error) {
    return <p>Error loading image</p>;
  }

  const wsrv = `https://wsrv.nl/?w=1200&url=${src}`;

  if (data) {
    return (
      <Suspense>
        <NextImage
          loading='eager'
          priority={true}
          src={wsrv}
          alt={alt ? alt : ``}
          width={data.width}
          height={data.height}
          style={{
            objectFit: `contain`,
            height: `fit-content`,
            width: `100%`,
          }}
        />
      </Suspense>
    );
  }
  return null;
}
