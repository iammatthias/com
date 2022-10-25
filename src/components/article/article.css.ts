import { style, globalStyle } from "@vanilla-extract/css";

export const article = style({
  display: `grid`,
  gridAutoRows: `minMax(min-content, max-content)`,
  gridTemplateColumns: `60ch 1fr 1fr 1fr 1fr`,
  "@media": {
    "screen and (max-width: 768px)": {
      gridTemplateColumns: `1fr`,
    },
  },
});

globalStyle(`${article} > *`, {
  gridColumn: `1`,
});

globalStyle(`${article} > pre`, {
  gridColumn: `1 / 3`,
  overflowX: `auto`,
  border: `1px solid #1a1a1a`,
  boxShadow: `0 4px 14px 9px rgb(0 0 0 / 3%)`,
});
