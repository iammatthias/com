import { style, globalStyle } from '@vanilla-extract/css';

export const main = style({
  margin: `2rem`,
  display: `grid`,
  gridTemplateColumns: `auto 1fr`,
  gap: `2rem`,
});

export const personal = style({
  width: `fit-content`,
  display: `flex`,
  flexDirection: `column`,
  gap: `1rem`,
});

export const article = style({
  display: `grid`,
  gridTemplateColumns: `60ch 1fr 1fr 1fr 1fr`,
  gridAutoRows: `minmax(min-content, max-content)`,
  gap: `16px`,
});

globalStyle(`${article} > *`, {
  gridColumn: `1`,
});

globalStyle(`${article} > pre`, {
  gridColumn: `1 / 4`,
  outline: `2px solid #eee`,
  boxShadow: `0 4px 14px 9px rgb(0 0 0 / 3%)`,
  padding: `32px`,
  overflow: `auto`,
  overflowWrap: `normal`,
  whiteSpace: `pre`,
});
