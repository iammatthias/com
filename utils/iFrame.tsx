'use client';

import IframeResizer from 'iframe-resizer-react';

export default function IFrame(props: any) {
  return <IframeResizer src={props.src} frameBorder="0" id="embed" heightCalculationMethod="taggedElement" />;
}
