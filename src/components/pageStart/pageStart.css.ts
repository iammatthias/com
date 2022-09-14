import { style } from '@vanilla-extract/css';

export const pageStart = style({
  width: `100%`,
  display: `flex`,
  flexDirection: `column`,
  justifyContent: `center`,
  alignItems: `center`,
  gap: `32px`,
  textAlign: `center`,
  gridColumn: `1 / 6`,
  '@media': {
    'screen and (min-width: 768px)': {
      gridColumn: `2 / 5`,
    },
  },
});
