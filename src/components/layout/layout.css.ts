import { style } from '@vanilla-extract/css';

export const layout = style({
  minHeight: `100vh`,
  display: `grid`,
  gridTemplateRows: `48px 1fr auto`,
});
