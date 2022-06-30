// sprinkles.css.ts
// Language: typescript

import { createTheme } from '@vanilla-extract/css';
import { createSprinkles, defineProperties } from '@vanilla-extract/sprinkles';

const space = {
  0: `0px`,
  4: `4px`,
  8: `8px`,
  12: `12px`,
  15: `15px`,
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

const colors = {
  black: `rgba(4, 4, 0, 1)`,
  blackFade: `rgba(19, 19, 21, .2)`,
  white: `rgba(249, 254, 255, 1)`,
  whiteFade: `rgba(253, 255, 252, .2)`,
  gray: `rgba(128, 128, 128, 1)`,
  blue: `rgba(3, 136, 252, 1)`,
  red: `rgba(249, 16, 74, 1)`,
  yellow: `rgba(255, 221, 0, 1)`,
  pink: `rgba(232, 141, 163, 1)`,
  turq: `rgba(0, 245, 196, 1)`,
  orange: `rgba(255, 135, 31, 1)`,
  bgGradient: `radial-gradient(circle at 50% 50%, rgba(249, 254, 255, 1), rgba(253, 255, 252, .2)), url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='6' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%' height='100%' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
  overlay: `blur(50px) saturate(382%) grayscale(50%) brightness(1.25)`,
};

export const [themeClass, vars] = createTheme({
  colors,
  font: {
    body: `Inter, arial`,
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
    paddingTop: space,
    paddingBottom: space,
    paddingLeft: space,
    paddingRight: space,
    margin: space,
    width: [`16px`, `100%`],
    height: [`16px`, `100%`],
    fontSize: space,
    fontWeight: fontWeight,
    gap: space,
    alignItems: [
      `flex-start`,
      `center`,
      `flex-end`,
      `space-between`,
      `space-around`,
    ],
    justifyContent: [
      `flex-start`,
      `center`,
      `flex-end`,
      `space-between`,
      `space-around`,
    ],
    position: [`relative`, `absolute`, `fixed`],
    display: [`none`, `block`, `flex`],
    flexDirection: [`row`, `column`],
    background: colors,
    backgroundImage: colors,
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
    color: colors,
    background: colors,
  },
});

export const atoms = createSprinkles(layoutStyles, colorStyles);
