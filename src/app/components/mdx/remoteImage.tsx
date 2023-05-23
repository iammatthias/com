"use client";

import { Suspense } from "react";
import NextImage from "next/image";
import { useImageSize } from "react-image-size";

export default function RemoteImage(props: any) {
  const { src, alt, caption } = props;

  const [data, { loading, error }] = useImageSize(src);

  if (loading) {
    return <div className='loading'>☾ ☼ ☽</div>;
  }

  if (error) {
    return <p>Error loading image</p>;
  }

  const imageLoader = ({ src }: any) => {
    return `${src}?w=200&q=${1}`;
  };

  if (data) {
    return (
      <Suspense>
        <figure style={{ position: `relative` }}>
          <NextImage
            priority
            loader={imageLoader}
            src={src}
            alt={alt ? alt : ``}
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
      </Suspense>
    );
  }
  return null;
}
