import { style } from '@vanilla-extract/css';

export const menuPageList = style({
  width: `100%`,
  display: `grid`,
  gap: `16px`,
  gridTemplateColumns: `repeat(3, 1fr)`,
  '@media': {
    'screen and (max-width: 768px)': {
      gridTemplateColumns: `repeat(2, 1fr)`,
    },
  },
});

export const menuPageListSingle = style({
  width: `100%`,
  display: `grid`,
  gap: `16px`,
  gridTemplateColumns: `1fr`,
});

export const menuItem = style({
  flexBasis: `30%`,
  borderTop: `2px solid black`,
  paddingTop: 12,
  paddingBottom: 12,
  paddingLeft: 8,
  paddingRight: 8,
  display: `grid`,
  gap: `16px`,
});
