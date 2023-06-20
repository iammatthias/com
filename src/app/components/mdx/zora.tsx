"use client";
import React, { useRef } from "react";
import IframeResizer from "iframe-resizer-react";

export default function ZoraEmbed({ address }: { address: string }) {
  const iframeRef = useRef(null);

  return (
    <>
      <hr />
      <IframeResizer
        forwardRef={iframeRef}
        heightCalculationMethod='lowestElement'
        inPageLinks
        log
        src={`https://zora.co/editions/${address}/frame?padding=20px&mediaPadding=20px&showDetails=true&theme=light&showMedia=true&showCollectors=false&showMintingUI=true`}
      />
    </>
  );
}
