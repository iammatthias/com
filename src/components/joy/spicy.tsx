// spicy

import { keyframes } from '@/styles/stitches.config';

export default function Spicy({ children, props }: any) {
  const gradient = keyframes({
    '0%': { backgroundPosition: `200% top` },
    '100%': { backgroundPosition: `200% bottom` },
  });
  return (
    <span
      {...props}
      css={{
        backgroundImage: `linear-gradient(to right, $colors$red5, $colors$blue5, $colors$green5`,
        backgroundSize: `200% auto`,
        backgroundClip: `text`,
        textFillColor: `transparent`,
        animation: `${gradient} 4s linear infinite`,
        fontFamily: `heading`,
      }}
    >
      {children}
    </span>
  );
}
