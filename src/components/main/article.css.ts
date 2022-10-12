import { style, globalStyle } from '@vanilla-extract/css';

export const article = style({
  display: `grid`,
  gridTemplateColumns: `1fr 60ch 1fr 1fr 1fr`,
  gridAutoRows: `minmax(min-content, max-content)`,
  gap: `16px`,
});

globalStyle(`${article} > *`, {
  gridColumn: `2`,
});

globalStyle(`${article} > pre`, {
  gridColumn: `2 / 4`,
  outline: `2px solid #aaa`,
  padding: `32px`,
  overflow: `auto`,
  overflowWrap: `normal`,
  whiteSpace: `pre`,
  boxShadow: `0 4px 14px 9px rgb(0 0 0 / 3%)`,
});
