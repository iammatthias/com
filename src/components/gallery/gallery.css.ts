import { style } from '@vanilla-extract/css';

export const wrapper = style({
  gridColumn: `1 / 6`,
  '@media': {
    'screen and (min-width: 768px)': {
      gridColumn: `2 / 5`,
    },
  },
});

export const masonry = style({
  display: `flex`,
  gap: `16px`,
});

export const image = style({
  position: `relative`,
  width: `100%`,
  marginBottom: `16px`,
});
