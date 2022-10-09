import { style } from '@vanilla-extract/css';

export const display = style({
  display: `grid`,
  gridTemplateColumns: `1fr 1fr 60ch 1fr 1fr`,
  gridAutoRows: `minmax(min-content, max-content)`,
  gap: `16px`,
});

export const padding = style({
  margin: `32px`,
});

export const main = style([display, padding]);
