// stitches.config.ts
import { createStitches } from '@stitches/react';

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
      black: `rgba(19, 19, 21, 1)`,
      white: `rgba(255, 255, 255, 1)`,
      gray: `rgba(128, 128, 128, 1)`,
      blue: `rgba(3, 136, 252, 1)`,
      red: `rgba(249, 16, 74, 1)`,
      yellow: `rgba(255, 221, 0, 1)`,
      pink: `rgba(232, 141, 163, 1)`,
      turq: `rgba(0, 245, 196, 1)`,
      orange: `rgba(255, 135, 31, 1)`,

      // Alias
      primary: `$black`,
      secondary: `$gray`,
      tertiary: `$turq`,
      link: `$blue`,
      background: `$white`,
      border: `$black`,
    },
    fontSizes: {
      1: `12px`,
      2: `14px`,
      3: `16px`,
      4: `20px`,
      5: `24px`,
      6: `32px`,
      7: `48px`,
    },
    space: {
      1: `4px`,
      2: `8px`,
      3: `16px`,
      4: `32px`,
      5: `64px`,
      6: `128px`,
    },
    sizes: {
      1: `4px`,
      2: `8px`,
      3: `16px`,
      4: `32px`,
      5: `64px`,
      6: `128px`,
    },
    radii: {
      1: `2px`,
      2: `4px`,
      3: `8px`,
      round: `9999px`,
    },
  },
  media: {
    dark: `(prefers-color-scheme: dark)`,
    bp1: `(min-width: 32rem)`,
    bp2: `(min-width: 48rem)`,
    bp3: `(min-width: 64rem)`,
    bp4: `(min-width: 96rem)`,
  },
});

export const darkTheme = createTheme({
  colors: {
    // Alias
    primary: `$white`,
    secondary: `$gray`,
    tertiary: `$turq`,
    link: `$blue`,
    background: `$black`,
    border: `$black`,
  },
});

export const reset = {
  'html, body, div, span, applet, object, iframe, h1, h2, h3, h4, h5, h6, p, blockquote, pre, a, abbr, acronym, address, big, cite, code, del, dfn, em, img, ins, kbd, q, s, samp, small, strike, strong, sub, sup, tt, var, b, u, i, center, dl, dt, dd, ol, ul, li, fieldset, form, label, legend, table, caption, tbody, tfoot, thead, tr, th, td, article, aside, canvas, details, embed, figure, figcaption, footer, header, hgroup, main, menu, nav, output, ruby, section, summary, time, mark, audio, video':
    {
      margin: `0`,
      padding: `0`,
      border: `0`,
      fontSize: `100%`,
      font: `inherit`,
      verticalAlign: `baseline`,
    },
  'article, aside, details, figcaption, figure, footer, header, hgroup, main, menu, nav, section':
    {
      display: `block`,
    },
  '*[hidden]': {
    display: `none`,
  },
  body: {
    lineHeight: `1`,
  },
  'ol, ul': {
    listStyle: `none`,
  },
  'blockquote, q': {
    quotes: `none`,
  },
  'blockquote:before, blockquote:after, q:before, q:after': {
    content: ``,
  },
  table: {
    borderSpacing: `0`,
  },
};

export const globalStyles = globalCss({
  ...reset,
  // dark mode
  '@dark': {
    // notice the `media` definition on the stitches.config.ts file
    ':root:not(.light)': {
      ...Object.keys(darkTheme.colors).reduce((varSet) => {
        return {
          ...varSet,
        };
      }, {}),
    },
  },

  // general
  '*': {
    wordBreak: `break-word`,
    whiteSpace: `normal`,
  },
  body: {
    background: `$background`,
    color: `$primary`,
    minHeight: `100vh`,
    fontFamily: `Inter, system-ui, sans-serif`,
    fontWeight: `400`,
    lineHeight: `1.618`,
    padding: `0`,
  },
  'h1, h2, h3, h4, h5, h6': {
    fontFamily: `"Playfair Display", serif`,
    fontWeight: `900`,
  },
  'pre, code': {
    fontFamily: `Space Mono, monospace`,
    border: `2px solid`,
    borderColor: `inherit`,
    borderRadius: `6px`,
    fontSize: `$2`,
  },
  pre: { padding: `0.35rem 0.65rem` },
  code: { padding: `0 0.35rem` },
  'pre code': {
    padding: `0.25rem 0.45rem`,
    border: `none`,
  },
  p: {
    fontSize: `$3`,
  },
  h1: {
    fontSize: `$7`,
    marginBottom: `$5`,
  },
  h2: {
    fontSize: `$6`,
    marginBottom: `$4`,
  },
  h3: {
    fontSize: `$5`,
    marginBottom: `$3`,
  },
  h4: {
    fontSize: `$4`,
    marginBottom: `$2`,
  },
  h5: {
    fontSize: `$3`,
    marginBottom: `$2`,
  },
  h6: {
    fontSize: `$2`,
    marginBottom: `$2`,
  },
  small: {
    fontSize: `$1`,
  },
  a: {
    color: `inherit`,
    fontWeight: `900`,
    textDecoration: `none`,
  },
  'ul, ol': {
    marginLeft: `$4`,
    fontFamily: `'Space Mono', monospace`,
  },
  ul: {
    listStyle: `circle`,
  },
  ol: {
    listStyle: `decimal`,
  },
  'b, strong': {
    fontWeight: `900`,
  },
  'i, em': {
    fontStyle: `italic`,
  },
  hr: {
    border: `2px solid $primary`,
    width: `100%`,
  },
  'blockquote, q': {
    borderLeft: `2px solid $primary`,
    marginBottom: `$3`,
    paddingLeft: `$3`,
  },

  // etc
  '.my-masonry-grid': {
    display: `flex`,
    gap: `24px`,
    '.my-masonry-grid_column': {
      paddingLeft: `24px`,
      backgroundClip: `padding-box`,
    },
    '.my-masonry-grid_column > div': {
      width: `calc(100% - 24px)`,
      marginBottom: `24px`,
    },
  },
  '#SRLLightbox': {
    backdropFilter: `blur(4px)`,
    button: {
      borderRadius: `4px`,
      margin: `16px`,
      padding: `2px`,
    },
  },
  '#gradient-canvas': {
    position: `fixed`,
    top: 0,
    left: 0,
    zIndex: `-11`,
    width: `100%`,
    height: `100%`,
    opacity: `0.1382`,
    '--gradient-color-1': `#c1ecf9`,
    '--gradient-color-2': `#bfefe2`,
    '--gradient-color-3': `#68dcfd`,
    '--gradient-color-4': `#70e0c8`,
    '--gradient-color-5': `#fac7be`,
  },
});

globalStyles();