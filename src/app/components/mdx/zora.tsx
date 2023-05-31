"use client";
import React, { useRef } from "react";
import IframeResizer from "iframe-resizer-react";

export default function ZoraEmbed({ address }: { address: string }) {
  const iframeRef = useRef(null);

  return (
    <>
      <hr />
      <h4>Collect this piece on Zora</h4>
      <IframeResizer
        forwardRef={iframeRef}
        heightCalculationMethod='lowestElement'
        inPageLinks
        log
        src={`https://zora.co/editions/${address}/frame?padding=20px&mediaPadding=20px&showDetails=false&theme=light&showMedia=false&showCollectors=false&showMintingUI=true`}
      />
    </>
  );
}
