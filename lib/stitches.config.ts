// stitches.config.ts
import { createStitches } from '@stitches/react';
import {
  blackA,
  whiteA,
  red,
  redDark,
  blue,
  blueDark,
  sky, 
  skyDark,
  green,
  greenDark,
  slate, 
  slateDark,
  gold,
  goldDark
} from '@radix-ui/colors';

export const {
  styled,
  css,
  globalCss,
  keyframes,
  getCssText,
  theme,
  createTheme,
  config,
} = createStitches({
  theme: {
    colors: {
      ...red,
      ...blue,
      ...sky,
      ...green,
      ...slate,
      ...gold,
    },
    space: {
      1: '4px',
      2: '8px',
      3: '16px',
      4: '24px',
      5: '32px',
      6: '40px',
      7: '48px'
    },
    fontSizes: {
      0: '14px',
      1: '16px',
      2: '18px',
      3: '24px',
      4: '32px',
      5: '48px',
      6: '64px'
    },
    fonts: {
      system: '"Crimson Pro", apple-system, Roboto, sans-serif',
      mono: 'Inconsolata, menlo, monospace',
    },
    transitions: {},
  },
  media: {
    dark: "(prefers-color-scheme: dark)",
    bp1: '(min-width: 32rem)',
    bp2: '(min-width: 48rem)',
    bp3: '(min-width: 64rem)',
    bp4: '(min-width: 96rem)',
  },
});

export const darkTheme = createTheme({
  colors: {
    ...redDark,
    ...blueDark,
    ...skyDark,
    ...greenDark,
    ...slateDark,
    ...goldDark,
  },
});

export const globalStyles = globalCss({
  body: {
    background: '$slate4',
    color: '$slate12',
    fontSize: '18px',
  },
  '.my-masonry-grid': {
    display: 'flex',
    gap: '24px',
    '.my-masonry-grid_column': {
      paddingLeft: '24px',
      backgroundClip: 'padding-box',
    },
    '.my-masonry-grid_column > div': {
      width: 'calc(100% - 24px)',
      marginBottom: '24px',
    },
  },
  '.gradient-canvas': {
    width: '100vw',
    height: '100vh',
    '--gradient-color-1': '#c3e4ff',
    '--gradient-color-2': '#6ec3f4',
    '--gradient-color-3': '#eae2ff',
    '--gradient-color-4': '#b9beff',
  },
  "@dark": {
    // notice the `media` definition on the stitches.config.ts file
    ":root:not(.light)": {
      ...Object.keys(darkTheme.colors).reduce((varSet) => {
        return {
          ...varSet,
        };
      }, {}),
    },
  },
});

globalStyles();