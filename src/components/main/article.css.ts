import { style } from '@vanilla-extract/css';

export const display = style({
  display: `flex`,
  flexDirection: `column`,
  gap: `16px`,
});

export const article = style([
  display,
  {
    gridColumn: `3`,
  },
]);
