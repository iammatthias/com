import colors from './colors'

const fonts = `system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Helvetica, sans-serif`

const theme = {
  breakpoints: [32, 48, 64, 96, 128].map(w => `${w}em`),
  space: [0, 4, 8, 16, 32, 64, 128, 256, 512],
  fontSizes: [12, 16, 20, 24, 32, 48, 64, 96],
  config: {
    initialColorModeName: 'light',
    useColorSchemeMediaQuery: false,
  },
  colors: {
    ...colors,
    primary: colors.blue[5],
    accent: colors.red[4],
    inverted: colors.grey[9],
    text: colors.grey[0],
    background: colors.grey[9],
    backgroundTint: colors.blue[9],
    elevated: colors.grey[8],
    sheet: colors.grey[8],
    sunken: colors.blue[9],
    border: colors.grey[1],
    placeholder: colors.grey[6],
    secondary: colors.blue[8],
    muted: colors.grey[7],

    modes: {
      dark: {
        accent: colors.gold[6],
        inverted: colors.grey[0],
        text: colors.grey[9],
        background: colors.grey[0],
        backgroundTint: colors.blue[1],
        elevated: colors.grey[1],
        sheet: colors.grey[1],
        sunken: colors.blue[1],
        border: colors.grey[8],
        placeholder: colors.grey[4],
        secondary: colors.blue[1],
        muted: colors.grey[2],
      },
    },
  },
  fonts: {
    monospace: `'Inconsolata', ui-monospace, monospace`,
    heading: `'Crimson Pro', ${fonts}`,
    body: `'Crimson Pro', ${fonts}`,
  },
  lineHeights: { heading: 1.382, body: 1.618 },
  fontWeights: {
    body: 400,
    bold: 900,
    heading: 200,
  },
  letterSpacings: { tracked: '0.1em', negative: '-0.05em' },
  shadows: {
    text: '0 1px 2px rgba(0, 0, 0, 0.25), 0 2px 4px rgba(0, 0, 0, 0.125)',
    small: '0 1px 2px rgba(0, 0, 0, 0.0625), 0 2px 4px rgba(0, 0, 0, 0.0625)',
    card: '0 4px 8px rgba(0, 0, 0, 0.125)',
    frame: '-10px -10px 20px -10px rgba(0, 0, 0, 0.125)',
    elevated:
      '0 1px 2px rgba(0, 0, 0, 0.0625), 0 8px 12px rgba(0, 0, 0, 0.125)',
  },
  text: {
    caption: {
      color: 'muted',
      fontSize: 1,
      letterSpacing: 'headline',
      lineHeight: 'caption',
    },
  },
  alerts: {
    primary: {
      borderRadius: 'default',
      bg: 'yellow',
      color: 'background',
      fontWeight: 'body',
      lineHeight: 'heading',
    },
  },
  badges: {
    pill: {
      borderRadius: 'circle',
      px: 3,
      py: 1,
    },
    outline: {
      borderRadius: 'circle',
      px: 3,
      py: 1,
      bg: 'transparent',
      borderStyle: 'solid',
      borderWidth: [3, 5],
      borderColor: 'currentColor',
    },
  },
  buttons: {
    primary: {
      py: 2,
      px: 3,
      textDecoration: 'none',
      display: 'inline-block',
      color: 'background',
      bg: 'text',
      cursor: 'pointer',
      fontFamily: 'heading',
      fontWeight: 'bold',
      borderRadius: 'default',
      textShadow: 'none',
      boxShadow: 'card',
      WebkitTapHighlightColor: 'transparent',
      transition: 'transform .125s ease-in-out, box-shadow .125s ease-in-out',
      ':focus,:hover': {
        boxShadow: 'elevated',
        transform: 'scale(1.0625)',
      },
      svg: { ml: -1, mr: 2, verticalAlign: 'middle' },
    },
    lg: {
      variant: 'buttons.primary',
      fontSize: 3,
      lineHeight: 'title',
      px: 4,
      py: 3,
    },
    outline: {
      variant: 'buttons.primary',
      bg: 'transparent',
      color: 'primary',
      border: '3px solid currentColor',
    },
    outlineLg: {
      variant: 'buttons.primary',
      bg: 'transparent',
      color: 'primary',
      border: '2px solid currentColor',
      lineHeight: 'title',
      fontSize: 3,
      px: 4,
      py: 3,
    },
  },
  cards: {
    primary: {
      color: 'text',
      p: [2, 3],
      borderRadius: '4px',
      boxShadow: 'card',
      overflow: 'hidden',
    },
  },
  forms: {
    input: {
      color: 'text',
      fontFamily: 'inherit',
      borderRadius: 'base',
      border: '1px solid',
      '::-webkit-input-placeholder': { color: 'placeholder' },
      '::-moz-placeholder': { color: 'placeholder' },
      ':-ms-input-placeholder': { color: 'placeholder' },
      '&[type="search"]::-webkit-search-decoration': { display: 'none' },
    },
    textarea: { variant: 'forms.input' },
    select: { variant: 'forms.input' },
    label: {
      color: 'text',
      display: 'flex',
      flexDirection: 'column',
      textAlign: 'left',
      lineHeight: 'caption',
      fontSize: 1,
    },
  },
  layout: {
    container: {
      maxWidth: ['layout', null, 'layoutPlus'],
      width: '100%',
      mx: 'auto',
      px: 4,
    },
    copy: {
      variant: 'layout.container',
      maxWidth: ['copy', null, 'copyPlus'],
    },
  },
  styles: {
    root: {
      fontFamily: 'body',
      lineHeight: 'body',
      fontWeight: 'body',
      fontSize: ['16px', '18px'],
      color: 'text',
      bg: 'sheet',
      margin: 0,
      overflowX: 'hidden',
      minHeight: '100vh',
      textRendering: 'optimizeLegibility',
      WebkitFontSmoothing: 'antialiased',
      MozOsxFontSmoothing: 'grayscale',
      '.headroom--pinned': { px: [3, 3, 4], pt: [4, 5] },
      h1: {
        variant: 'text.heading',
        fontSize: '4.209rem',
      },
      h2: {
        variant: 'text.heading',
        fontSize: '3.175rem',
      },
      h3: {
        variant: 'text.heading',
        fontSize: '2.369rem',
        mb: 0,
      },
      h4: {
        variant: 'text.heading',
        fontSize: '1.777rem',
      },
      h5: {
        variant: 'text.heading',
        fontSize: '1.333rem',
      },
      h6: {
        variant: 'text.heading',
        fontSize: '1rem',
      },
      p: {
        color: 'text',
        fontWeight: 'body',
        lineHeight: 'body',
        fontSize: '1rem',
        my: 3,
      },
      small: { fontSize: '.75rem' },
      img: {
        maxWidth: '100%',
      },
      hr: {
        border: '1px solid',
        borderColor: 'accent',
        mx: 'auto',
        my: 4,
      },
      a: {
        color: 'text',
        textDecoration: 'inherit',
        fontWeight: 'bold',
        transition: 'color .125s ease-in-out',
        ':focus,:hover': {
          color: 'accent',
        },
      },
      code: {
        fontFamily: 'monospace',
        fontSize: 'inherit',
        color: 'text',

        borderRadius: 'small',
        m: 0,
        p: 0.5,
        boxDecorationBreak: 'clone',
      },
      pre: {
        fontFamily: 'monospace',
        fontSize: 1,
        p: 3,
        color: 'text',
        overflow: 'auto',
        borderRadius: '4px',
        border: '1px solid',
        code: {
          m: 0,
          p: 0,
        },
      },
      blockquote: {
        borderLeft: '2px solid',
        borderColor: 'inherit',
        margin: 0,
        paddingLeft: 3,
      },

      li: {
        my: 2,
      },
      table: {
        width: '100%',
        my: 4,
        borderCollapse: 'separate',
        borderSpacing: 0,
        'th,td': {
          textAlign: 'left',
          py: '4px',
          pr: '4px',
          pl: 0,
          borderColor: 'border',
          borderBottomStyle: 'solid',
        },
      },
      th: {
        verticalAlign: 'bottom',
        borderBottomWidth: '1px',
      },
      td: {
        verticalAlign: 'top',
        borderBottomWidth: '0.5px',
      },
    },
  },
  util: {
    motion: '@media (prefers-reduced-motion: no-preference)',
    reduceMotion: '@media (prefers-reduced-motion: reduce)',
    reduceTransparency: '@media (prefers-reduced-transparency: reduce)',
    supportsClipText: '@supports (-webkit-background-clip: text)',
    supportsBackdrop:
      '@supports (-webkit-backdrop-filter: none) or (backdrop-filter: none)',
  },
}

export default theme
