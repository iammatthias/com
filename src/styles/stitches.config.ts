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

      // Alias
      primary: `$black`,
      secondary: `$gray`,
      tertiary: `$turq`,
      link: `$blue`,
      background: `$white`,
      border: `$black`,
      faded: `$whiteFade`,
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
    faded: `$blackFade`,
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
  // fonts
  '@font-face': {
    fontFamily: `mayes`,
    src: `url('/fonts/Mayes-Regular.woff') format('woff supports')`,
    fontWeight: `400`,
    fontDisplay: `swap`,
    fontStyle: `normal`,
  },
  '@supports (font-variation-settings: normal)': {
    '@font-face': {
      fontFamily: `mayes`,
      src: `url('/fonts/Mayes-Mayes.woff')`,
      fontWeight: `400 900`,
      fontDisplay: `swap`,
      fontStyle: `normal`,
      fontSmooth: `always`,
    },
  },

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
  ':root': {
    fontFamily: `"Crimson Text", system-ui, sans-serif`,
    fontWeight: `400`,
    lineHeight: `1.618`,
  },
  html: {
    fontSize: `16px`,
    minHeight: `calc(100% + env(safe-area-inset-top))`,
    padding: `env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)`,
  },
  body: {
    color: `$primary`,
    minHeight: `100vh`,
    fontSize: `1.125em`,
    lineHeight: `1.6`,
    padding: `0`,
  },
  'h1, h2, h3, h4, h5, h6': {
    fontFamily: `"mayes", sans-serif`,
    fontWeight: `900`,
  },
  p: {
    fontSize: `1.2292em`,
    '@bp1': {
      fontSize: `1.2083em`,
    },
    '@bp2': {
      fontSize: `1.2083em`,
    },
    '@bp3': {
      fontSize: `1.1667em`,
    },
    '@bp4': {
      fontSize: `1.125em`,
    },
  },
  h1: {
    marginBottom: `$4`,
    fontSize: `3.7917em`,
    '@bp1': {
      fontSize: `4.3958em`,
    },
    '@bp2': {
      fontSize: `5.3333em`,
    },
    '@bp3': {
      fontSize: `7.0417em`,
    },
    '@bp4': {
      fontSize: `9em`,
    },
  },
  h2: {
    marginBottom: `$3`,
    fontSize: `2.4583em`,
    '@bp1': {
      fontSize: `2.6667em`,
    },
    '@bp2': {
      fontSize: `3em`,
    },
    '@bp3': {
      fontSize: `3.5208em`,
    },
    '@bp4': {
      fontSize: `4.5em`,
    },
  },
  h3: {
    marginBottom: `$2`,
    fontSize: `1.8958em`,
    '@bp1': {
      fontSize: `2em`,
    },
    '@bp2': {
      fontSize: `2.125em`,
    },
    '@bp3': {
      fontSize: `2.3333em`,
    },
    '@bp4': {
      fontSize: `2.6667em`,
    },
  },
  h4: {
    marginBottom: `$1`,
    fontSize: `1.6042em`,
    '@bp1': {
      fontSize: `1.6458em`,
    },
    '@bp2': {
      fontSize: `1.6875em`,
    },
    '@bp3': {
      fontSize: `1.7708em`,
    },
    '@bp4': {
      fontSize: `1.8958em`,
    },
  },
  h5: {
    marginBottom: `$0`,
    fontSize: `1.4583em`,
    '@bp1': {
      fontSize: `1.4792em`,
    },
    '@bp2': {
      fontSize: `1.5em`,
    },
    '@bp3': {
      fontSize: `1.5417em`,
    },
    '@bp4': {
      fontSize: `1.6042em`,
    },
  },
  h6: {
    fontSize: `1.6667em`,
    '@bp1': {
      fontSize: `1.3333em`,
    },
    '@bp2': {
      fontSize: `1.3333em`,
    },
    '@bp3': {
      fontSize: `1.3333em`,
    },
    '@bp4': {
      fontSize: `1.3333em`,
    },
  },
  'small, pre, code': {
    fontSize: `1.0417em`,
    '@bp1': {
      fontSize: `1em`,
    },
    '@bp2': {
      fontSize: `0.9583em`,
    },
    '@bp3': {
      fontSize: `0.8958em`,
    },
    '@bp4': {
      fontSize: `0.8125em`,
    },
  },
  figure: {
    fontSize: `1.125em`,
    '@bp1': {
      fontSize: `1.1042em`,
    },
    '@bp2': {
      fontSize: `1.0625em`,
    },
    '@bp3': {
      fontSize: `1.0208em`,
    },
    '@bp4': {
      fontSize: `0.9583em`,
    },
  },
  a: {
    color: `inherit`,
    fontFamily: `"Crimson Text", serif`,
    fontWeight: `700`,
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
    fontSize: `1.6667em`,
    '@bp1': {
      fontSize: `1.6667em`,
    },
    '@bp2': {
      fontSize: `1.6667em`,
    },
    '@bp3': {
      fontSize: `7.0417em`,
    },
    '@bp4': {
      fontSize: `1.3333em`,
    },
  },
  '.mono': {
    fontFamily: `Space Mono, monospace`,
  },
  'pre, code': {
    fontFamily: `Space Mono, monospace`,
    border: `1px solid`,
    borderColor: `inherit`,
  },
  pre: { padding: `0.35rem 0.65rem` },
  code: { margin: `0`, padding: `0 0.25rem` },
  'pre code': {
    padding: `0.25rem 0.45rem`,
    border: `none`,
  },

  // etc
  '.my-masonry-grid': {
    display: `flex`,
    gap: `8px`,
    '.my-masonry-grid_column': {
      paddingLeft: `8px`,
      backgroundClip: `padding-box`,
    },
    '.my-masonry-grid_column > div': {
      width: `calc(100% - 8px)`,
      marginBottom: `8px`,
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
  '.mBleed': {
    gridColumn: `3 / 6 !important`,
  },
  '.lBleed': {
    gridColumn: `2 / 7 !important`,
  },
  '.fullBleed': {
    gridColumn: `1 / 8 !important`,
  },
});
