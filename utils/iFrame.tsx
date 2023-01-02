'use client';

import {
  // useRef,
  Suspense,
} from 'react';

// import IframeResizer from 'iframe-resizer-react';

export default function IFrame(props: any) {
  // const iframeRef = useRef(null);

  return (
    <Suspense fallback={<p>Loading...</p>}>
      {/* <IframeResizer
        forwardRef={iframeRef}
        inPageLinks
        log={false}
        src={props.src}
        frameBorder="0"
        heightCalculationMethod="taggedElement"
        checkOrigin={false}
        title="iframe"
        loading="lazy"
      /> */}
      <iframe loading="lazy" {...props} />
    </Suspense>
  );
}
