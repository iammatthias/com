import { style } from '@vanilla-extract/css';

export const height = style({
  height: `48px`,
});

export const display = style({
  display: `flex`,
  alignItems: `center`,
  justifyContent: `center`,
});

export const text = style({
  fontSize: `16px`,
  fontWeight: `700`,
  textTransform: `uppercase`,
});

export const footer = style([
  height,
  display,
  text,
  {
    background: `#282c34`,
    color: `white`,
    padding: `0 32px`,
  },
]);
