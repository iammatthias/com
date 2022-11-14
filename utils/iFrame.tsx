'use client';

import { useRef } from 'react';

import IframeResizer from 'iframe-resizer-react';
import Link from 'next/link';

export default function IFrame(props: any) {
  const iframeRef = useRef(null);

  return (
    <>
      <IframeResizer
        forwardRef={iframeRef}
        inPageLinks
        log={false}
        src={props.src}
        frameBorder="0"
        heightCalculationMethod="taggedElement"
        checkOrigin={false}
      />
      {props._src.includes('zora') && (
        <p>
          <Link href={props._src}>View on Zora</Link>
        </p>
      )}
    </>
  );
}
