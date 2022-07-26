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
  flexDirection: `column`,
  justifyContent: `center`,
  alignItems: `center`,
  background: `#fdfcfc`,
});

export const headerVR = style({
  borderLeft: `2px solid #1a1a1a`,
  minHeight: `16px`,
  height: `10vh`,
  maxHeight: `128px`,
});

export const navList = style({
  display: `flex`,
  flexDirection: `row`,
  gap: `32px`,
  '@media': {
    'screen and (max-width: 768px)': {
      gap: `16px`,
    },
  },
});

export const navListItem = style({
  border: `none`,
  padding: `0`,
  background: `unset`,
  fontSize: `16px`,
  fontFamily: `Losta Bonita`,
  color: `#1a1a1a`,
  ':visited': { color: `#1a1a1a` },
  ':hover': { color: `#1a1a1a` },
  ':active': { color: `#1a1a1a` },
});

export const navContent = style({
  display: `flex`,
  gap: `32px`,
  flexDirection: `column`,
});

export const navViewport = style({
  position: `absolute`,
  top: `94px`,
  background: `#fdfcfc`,
  border: `2px solid #1a1a1a`,
  zIndex: `2`,
  padding: `32px`,
});

export const navArrow = style({
  display: `inline-block`,
});

export const menuPageList = style({
  width: `100%`,
  display: `grid`,
  gap: `16px`,
  gridTemplateColumns: `repeat(3, 1fr)`,
  '@media': {
    'screen and (max-width: 768px)': {
      gridTemplateColumns: `repeat(1, 1fr)`,
    },
  },
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
