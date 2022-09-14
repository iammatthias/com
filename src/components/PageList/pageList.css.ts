import { atoms } from '@/styles/atoms.css';
import { style } from '@vanilla-extract/css';

export const menuPageList = style({
  width: `100%`,
  display: `flex`,
  flexDirection: `column`,
  gap: `32px`,
  gridColumn: `1 / 6`,
  '@media': {
    'screen and (min-width: 768px)': {
      gridColumn: `2 / 5 !important`,
    },
  },
});

export const menuPageListSingle = style({
  width: `100%`,
});

export const menuItem = style({
  width: `100%`,
  display: `flex`,
  flexDirection: `column`,
  justifyContent: `space-between`,
  textAlign: `center`,
  gap: `32px`,
  '@media': {
    'screen and (min-width: 768px)': {
      textAlign: `unset`,
      flexDirection: `row`,
    },
  },
});

export const menuItemWrapper = style({
  width: `100%`,
  display: `flex`,
  flexDirection: `column`,
  justifyContent: `space-between`,
  textAlign: `center`,
  gap: `32px`,
});
