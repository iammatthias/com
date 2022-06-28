import { style } from '@vanilla-extract/css';
import { fontStyles, fonts } from './typography.css';

export const layout = style({
  padding: `16px`,
  display: `flex`,
  flexDirection: `column`,
  alignItems: `flex-start`,
  gap: `16px`,
});

export const label = fontStyles.SMALL;

export const p = fontStyles.P;

export const h2 = fontStyles.H2;

export const h1 = fontStyles.H1;

export const boldText = style([
  fontStyles.P,
  {
    fontVariationSettings: `"wght" ${fonts.INTER.weights.bold}`,
    color: `red`,
  },
]);
