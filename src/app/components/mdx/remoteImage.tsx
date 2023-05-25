"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import NextImage from "next/image";
import { useImageSize } from "react-image-size";

function useAboveTheFold(): [React.RefObject<HTMLElement>, boolean] {
  const ref = useRef<HTMLElement>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      setIsInView(entry.isIntersecting);
    });
    const currentRef = ref.current;
    if (currentRef) {
      observer.observe(currentRef);
    }
    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, []);

  return [ref, isInView];
}

export default function RemoteImage(props: any) {
  const { src, alt, caption } = props;
  const [ref, isInView] = useAboveTheFold();

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

  const wsrv = `https://wsrv.nl/?w=600&url=${src}`;

  if (data) {
    return (
      <Suspense>
        <figure ref={ref} style={{ position: `relative` }}>
          <NextImage
            priority={isInView as boolean}
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
          {alt && <figcaption>{caption}</figcaption>}
        </figure>
      </Suspense>
    );
  }
  return null;
}
