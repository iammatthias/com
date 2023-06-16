"use client";

import { useEffect, useState } from "react";
import ReactPlayer from "react-player";

export default function Video({ src }: { src: string }) {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  return isLoaded ? (
    <>
      <ReactPlayer
        url={src}
        playing={true}
        loop={true}
        muted={true}
        volume={1}
        controls={true}
      />
    </>
  ) : null;
}
