import { style } from '@vanilla-extract/css';

export const header = style({
  position: `relative`,
  height: `96px`,
  width: `100%`,
  display: `flex`,
  flexDirection: `column`,
  justifyContent: `center`,
  alignItems: `center`,
  background: `#fdfcfc`,
  borderBottom: `2px solid #1a1a1a`,
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
  zIndex: 9999,
  WebkitTransform: `translateZ(9999px)`,
  top: `94px`,
  background: `#fdfcfc`,
  border: `2px solid #1a1a1a`,
  margin: `0 8px`,
  padding: `32px`,
  maxWidth: `900px`,
  width: `100%`,
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
      gridTemplateColumns: `repeat(2, 1fr)`,
    },
  },
});

export const menuItem = style({
  flexBasis: `30%`,
  paddingTop: 12,
  paddingBottom: 12,
  display: `grid`,
  gap: `16px`,
});
