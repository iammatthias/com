import { style } from '@vanilla-extract/css';

export const squiggleContainer = style({
  width: `100%`,
  margin: `0 auto`,
  color: `black`,
});

export const squiggle = style({
  display: `block`,
  overflow: `visible`,
  textAlign: `center`,
  strokeWidth: `2`,
});
