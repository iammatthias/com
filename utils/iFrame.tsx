'use client';

import { useRef } from 'react';

import IframeResizer from 'iframe-resizer-react';

export default function IFrame(props: any) {
  const iframeRef = useRef(null);
  return (
    <IframeResizer
      forwardRef={iframeRef}
      src={props.src}
      frameBorder="0"
      id="embed"
      heightCalculationMethod="taggedElement"
    />
  );
}
