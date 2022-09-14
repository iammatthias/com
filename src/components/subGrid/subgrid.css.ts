import { globalStyle, style } from '@vanilla-extract/css';

export const subgrid = style({
  gridColumn: `1 / 6 !important`,
  position: `relative`,
  display: `grid`,
  gap: `32px`,
  gridAutoRows: `minmax(min-content, max-content)`,
  gridTemplateColumns: `1fr 1fr 1fr 1fr 1fr`,
  '@media': {
    'screen and (min-width: 768px)': {
      gridTemplateColumns: `1fr 1fr 600px 1fr 1fr`,
    },
  },
});

globalStyle(`${subgrid} > *`, {
  gridColumn: `1 / 6`,
  '@media': {
    'screen and (min-width: 768px)': {
      gridColumn: `3 / 4`,
    },
  },
});
