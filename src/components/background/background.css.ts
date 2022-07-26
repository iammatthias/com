import { style } from '@vanilla-extract/css';

export const background = style({
  position: `fixed`,
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  zIndex: -1,
  filter: `grayscale(1)`,
  backgroundAttachment: `fixed`,
  background: `radial-gradient(circle at 50% 50%, rgba(249, 254, 255, 1), rgba(253, 255, 252, .2)), url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='6' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%' height='100%' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
});
