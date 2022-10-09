import { style } from '@vanilla-extract/css';

export const height = style({
  height: `48px`,
});

export const position = style({
  position: `sticky`,
  top: 0,
  alignSelf: `start`,
});

export const display = style({
  display: `flex`,
  alignItems: `center`,
  justifyContent: `space-between`,
});

export const text = style({
  fontSize: `16px`,
  fontWeight: `700`,
  textTransform: `uppercase`,
});

export const header = style([
  height,
  position,
  display,
  text,
  {
    background: `#282c34`,
    color: `white`,
    padding: `0 32px`,
  },
]);
