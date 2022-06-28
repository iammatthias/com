// sprinkles.css.ts

import { createTheme } from '@vanilla-extract/css';
import { defineProperties, createSprinkles } from '@vanilla-extract/sprinkles';

const space = {
  0: `0px`,
  4: `4px`,
  8: `8px`,
  12: `12px`,
  16: `16px`,
  20: `20px`,
  24: `24px`,
  28: `28px`,
  32: `32px`,
  36: `36px`,
  40: `40px`,
  44: `44px`,
  48: `48px`,
  52: `52px`,
  56: `56px`,
  60: `60px`,
  64: `64px`,
  68: `68px`,
  72: `72px`,
  76: `76px`,
  80: `80px`,
  84: `84px`,
  88: `88px`,
  92: `92px`,
  96: `96px`,
  100: `100px`,
  104: `104px`,
  108: `108px`,
  112: `112px`,
  116: `116px`,
  120: `120px`,
  124: `124px`,
};

const fontWeight = {
  100: `100`,
  200: `200`,
  300: `300`,
  400: `400`,
  500: `500`,
  600: `600`,
  700: `700`,
  800: `800`,
  900: `900`,
};

export const [themeClass, vars] = createTheme({
  color: {
    blue50: `#eff6ff`,
    blue100: `#dbeafe`,
    blue200: `#bfdbfe`,
    yellow: `#aaff00`,
  },
  font: {
    body: `arial`,
  },
  fontSize: space,
  fontWeight: fontWeight,
  space: space,
});

const layoutStyles = defineProperties({
  conditions: {
    mobile: {},
    tablet: { '@media': `screen and (min-width: 768px)` },
    desktop: { '@media': `screen and (min-width: 1024px)` },
  },
  defaultCondition: `mobile`,
  properties: {
    display: [`none`, `block`, `flex`],
    flexDirection: [`row`, `column`],
    paddingTop: vars.space,
    paddingBottom: vars.space,
    paddingLeft: vars.space,
    paddingRight: vars.space,
    margin: vars.space,
    width: [`16px`, `100%`],
    fontSize: vars.fontSize,
    fontWeight: vars.fontWeight,
    // etc.
  },
  shorthands: {
    padding: [`paddingTop`, `paddingBottom`, `paddingLeft`, `paddingRight`],
    paddingX: [`paddingLeft`, `paddingRight`],
    paddingY: [`paddingTop`, `paddingBottom`],
  },
});

const colorStyles = defineProperties({
  properties: {
    color: vars.color,
    background: vars.color,
    // etc.
  },
});

export const atoms = createSprinkles(layoutStyles, colorStyles);
