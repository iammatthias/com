import { style } from '@vanilla-extract/css';

export const footer = style({
  height: `128px`,
  width: `100%`,
  borderTop: `2px solid #1a1a1a`,
  display: `flex`,
  flexDirection: `column`,
  justifyContent: `center`,
  alignItems: `center`,
  background: `#fdfcfc`,
});

export const lowPolySVG = style({
  height: `44px`,
  margin: `0 auto`,
  fill: `#131315`,
});
