import { style, globalStyle } from '@vanilla-extract/css';

export const layout = style({
  display: `flex`,
  flexDirection: `column`,
  justifyContent: `space-between`,
  alignItems: `center`,
  minHeight: `100vh`,
  gap: `32px`,
});

export const content = style({
  display: `grid`,
  gridTemplateColumns: `1fr min(65ch, 100%) 1fr`,
  gridAutoRows: `minmax(min-content, max-content)`,
  gap: `16px`,
  margin: `0 16px`,
  '@media': {
    'screen and (max-width: 768px)': {
      gridTemplateColumns: `100%`,
    },
  },
});

globalStyle(`${content} > *`, {
  gridColumn: `2`,
  '@media': {
    'screen and (max-width: 768px)': {
      gridColumn: `1`,
    },
  },
});

globalStyle(`${content} > .fullBleed`, {
  width: `100%`,
  gridColumn: `1 / 4`,
  '@media': {
    'screen and (max-width: 768px)': {
      gridColumn: `1`,
    },
  },
});
