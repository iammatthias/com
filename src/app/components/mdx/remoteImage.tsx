"use client";

import { useState, useEffect, Suspense } from "react";
import NextImage from "next/image";
import { useImageSize } from "react-image-size";

export default function RemoteImage(props: any) {
  const { src, alt, caption } = props;
  const [imageSrc, setImageSrc] = useState<string | null>(null); // set the initial state to null or string
  const [isSvg, setIsSvg] = useState<boolean>(false); // set a new state to keep track if image is SVG

  const [data, { loading, error }] = useImageSize(src);

  const wsrv = `https://wsrv.nl/?w=1200&n=-1&url=${src}`;

  async function isSVGImage(url: RequestInfo | URL) {
    try {
      const response = await fetch(url, { method: "HEAD" });
      const contentType = response.headers.get("content-type");
      return contentType === "image/svg+xml";
    } catch (error) {
      console.error("Error checking image format:", error);
      return false;
    }
  }

  useEffect(() => {
    const checkImage = async () => {
      const svgCheck = await isSVGImage(src);
      setIsSvg(svgCheck);
      if (svgCheck || src.includes("imgur")) {
        setImageSrc(src);
      } else {
        setImageSrc(wsrv);
      }
    };

    checkImage();
  }, [src, wsrv]);

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
      <Suspense>
        {isSvg ? (
          <div
            style={{
              position: "relative",
              aspectRatio: "1 / 1",
              overflow: "hidden",
            }}>
            <NextImage
              loading='eager'
              priority={true}
              src={imageSrc || src}
              alt={alt ? alt : ``}
              width={data.width == 300 ? 1200 : data.width}
              height={data.height == 150 ? 1200 : data.height}
              style={{
                maxWidth: "100%",
                maxHeight: "100%",
                objectFit: "cover",
                objectPosition: "center center",
              }}
              unoptimized={true}
            />
          </div>
        ) : (
          <NextImage
            loading='eager'
            priority={true}
            src={imageSrc || src}
            alt={alt ? alt : ``}
            width={data.width == 300 ? 900 : data.width}
            height={data.height == 150 ? 900 : data.height}
            style={{
              objectFit: `contain`,
              objectPosition: `center`,
              height: `fit-content`,
              width: `100%`,
            }}
            unoptimized={true}
          />
        )}
      </Suspense>
    );
  }
  return null;
}
