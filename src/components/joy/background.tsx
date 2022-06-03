// background.tsx
import { styled } from '@/styles/stitches.config';

export const Background = styled(`div`, {
  background: `radial-gradient(circle at 50% 50%, $background, $faded),
    url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='4.67' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
  backgroundSize: `cover`,
  position: `fixed`,
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  zIndex: -1,
});
