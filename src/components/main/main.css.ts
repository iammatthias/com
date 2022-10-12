import { style } from '@vanilla-extract/css';

export const alignCenter = style({
  display: `flex`,
  alignItems: `center`,
});

export const padding = style({
  margin: `32px`,
});

export const main = style([padding]);
