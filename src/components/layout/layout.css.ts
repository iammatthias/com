import { style } from "@vanilla-extract/css";

export const layout = style({
  minHeight: `100vh`,
  display: `grid`,
  gridTemplateRows: `auto 1fr auto`,
  margin: `0 16px`,
});
