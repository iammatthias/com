"use client";

import { useState, useEffect } from "react";
import NextImage from "next/image";
import { useImageSize } from "react-image-size";

export default function RemoteImage(props: any) {
  const { src, alt } = props;

  // if source is just a filename, add the full url

  const _src = src.includes(`http`)
    ? src
    : `https://pub-8bcf4a42832e4273a5a34c696ccc1b55.r2.dev/${src}`;

  const [data, { loading, error }] = useImageSize(_src);

  const wsrv = `https://wsrv.nl/?w=900&dpr=2&n=-1&url=${_src}`;

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

  if (data) {
    return (
      <NextImage
        loading='eager'
        priority={true}
        src={wsrv}
        alt={alt ? alt : ``}
        width={data.width == 300 ? 900 : data.width}
        height={data.height == 150 ? 900 : data.height}
        style={{
          objectFit: `contain`,
          objectPosition: `center`,
          height: `fit-content`,
          width: `100%`,
        }}
      />
    );
  }
  return null;
}
