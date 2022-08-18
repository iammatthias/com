import { style, globalStyle } from '@vanilla-extract/css';

export const featured = style({
  display: `flex`,
  flexDirection: `column`,
  gap: `16px`,
  width: `100%`,
});

export const content = style({
  display: `grid`,
  gridTemplateColumns: `1fr min(65ch, 100%) 1fr`,
  gridAutoRows: `minmax(min-content, max-content)`,
  gap: `16px`,
  width: `100%`,
  '@media': {
    'screen and (max-width: 768px)': {
      gridTemplateColumns: `100%`,
    },
  },
});

globalStyle(`${content} > *`, {
  width: `100%`,
  gridColumn: `2`,
  '@media': {
    'screen and (max-width: 768px)': {
      gridColumn: `1`,
    },
  },
});
