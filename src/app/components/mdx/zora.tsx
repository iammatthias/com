"use client";
import React from "react";
import IframeResizer from "iframe-resizer-react";

export default function ZoraEmbed({ address }: { address: string }) {
  return (
    <>
      <hr />
      <IframeResizer
        heightCalculationMethod='taggedElement'
        inPageLinks
        src={`https://zora.co/editions/${address}/frame?padding=20px&mediaPadding=20px&showDetails=true&theme=light&showMedia=false&showCollectors=false&showMintingUI=true`}
      />
    </>
  );
}
