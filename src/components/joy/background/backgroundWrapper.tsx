import { useEffect, useRef } from 'react';
import { Gradient } from './gradient';

export default function Background({ ...props }) {
  const gradient: any = new Gradient();
  const ref: any = useRef();

  useEffect(() => {
    if (ref.current) {
      // console.log(ref)
      gradient.initGradient(`#gradient-canvas`);
    }
  });
  return (
    <canvas ref={ref} id="gradient-canvas" data-transition-in {...props} />
  );
}
