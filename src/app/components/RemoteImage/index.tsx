"use client";

import NextImage from "next/image";
import { useImageSize } from "react-image-size";

interface RemoteImageProps {
  src: string;
  alt: string;
  mimeType?: string;
  caption?: string;
}

export default function RemoteImage({
  src,
  mimeType,
  alt,
  caption,
}: RemoteImageProps) {
  const [data, { loading, error }] = useImageSize(src);

  const isUnoptimized =
    mimeType === "image/gif" || mimeType === "image/svg+xml";

  return (
    <>
      {loading && <>Loading...</>}
      {error && <>Error loading image</>}
      {data && (
        <figure style={{ position: "relative" }}>
          <NextImage
            priority
            src={src}
            alt={alt}
            width={data.width}
            height={data.height}
            unoptimized={isUnoptimized}
            style={{
              objectFit: "contain",
              height: "fit-content",
              width: "100%",
            }}
          />

          {caption && <figcaption>{caption}</figcaption>}
        </figure>
      )}
    </>
  );
}
