import { style, globalStyle } from '@vanilla-extract/css';

export const txMeta = style({
  outline: `2px solid #eee`,
  boxShadow: `0 4px 14px 9px rgb(0 0 0 / 3%)`,
  color: `#555`,
  fontFamily: `Space Mono, monospace`,
  margin: `32px 0`,
});

globalStyle(`${txMeta} > *`, {
  outline: `1px solid #eee`,
  padding: `8px 16px`,
});
