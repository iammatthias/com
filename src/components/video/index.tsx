"use client";

import { useEffect, useState } from "react";
import ReactPlayer from "react-player";
import styles from "./styles.module.css";

export default function Video({ src }: { src: string }) {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  return isLoaded ? (
    <ReactPlayer
      url={src}
      playing={true}
      loop={true}
      muted={true}
      volume={1}
      controls={true}
      width='100%'
      height='fit-content'
    />
  ) : null;
}
