import { style } from '@vanilla-extract/css';

export const headerWrapper = style({
  width: `100%`,
  display: `flex`,
  flexDirection: `column`,
  justifyContent: `center`,
  alignItems: `center`,
});

export const header = style({
  height: `96px`,
  width: `100%`,
  borderBottom: `2px solid #1a1a1a`,
  display: `flex`,
  flexDirection: `row`,
  justifyContent: `center`,
  alignItems: `center`,
  background: `#fdfcfc`,
  gap: `32px`,
});

export const headerVR = style({
  borderLeft: `2px solid #1a1a1a`,
  minHeight: `16px`,
  height: `10vh`,
  maxHeight: `128px`,
});
