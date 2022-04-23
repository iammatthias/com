import { useEffect } from 'react';
import { Gradient } from './gradient';
// import GradientSVG from './gradientSVG';

export default function Background({ ...props }) {
  const gradient: any = new Gradient();

  useEffect(() => {
    // if (ref.current) {
    //   // console.log(ref)
    //   gradient.initGradient(`#gradient-canvas`);
    // }
    gradient.initGradient(`#gradient-canvas`);
  });

  return (
    <canvas id="gradient-canvas" data-transition-in {...props} />
    // <GradientSVG />
  );
}
