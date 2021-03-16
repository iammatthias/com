export default {
  useCustomProperties: true,
  useColorSchemeMediaQuery: false,
  initialColorModeName: 'light',
  space: [0, 4, 8, 16, 32, 64, 128, 256, 512],
  fonts: {
    body: 'Cormorant Garamond, system-ui, sans-serif',
    heading: 'Cormorant Garamond, system-ui, serif',
    monospace: 'Inconsolata, Menlo, monospace',
    cursive: 'Pacifico, cursive',
  },
  fontSizes: [14, 18, 24, 36, 54, 81, 122, 182, 264],
  fontWeights: {
    body: 300,
    heading: 700,
    bold: 700,
  },
  lineHeights: {
    body: 1.54,
    heading: 1.33,
  },
  colors: {
    modes: {
      light: {
        text: '#0C0908',
        background: '#F4F2F1',
        primary: '#233F43',
        secondary: '#87B8C0',
        accent: '#E45225',
        muted: '#A5958D',
      },
      dark: {
        text: '#F4F2F1',
        background: '#0C0908',
        primary: '#87B8C0',
        secondary: '#233F43',
        accent: '#E45225',
        muted: '#A5958D',
      },
    },
  },
  styles: {
    root: {
      fontFamily: 'body',
      lineHeight: 'body',
      fontWeight: 'body',
      fontSize: 1,
      color: 'text',
      paddingBottom: 3,
      webkitTapHighlightColor: 'transparent',

      h1: {
        color: 'text',
        fontFamily: 'heading',
        lineHeight: 'heading',
        fontWeight: 'heading',
        fontSize: 5,
        paddingBottom: 4,
      },
      h2: {
        color: 'text',
        fontFamily: 'heading',
        lineHeight: 'heading',
        fontWeight: 'heading',
        fontSize: 4,
        paddingBottom: 4,
      },
      h3: {
        color: 'text',
        fontFamily: 'heading',
        lineHeight: 'heading',
        fontWeight: 'heading',
        fontSize: 3,
        paddingBottom: 4,
      },
      h4: {
        color: 'text',
        fontFamily: 'heading',
        lineHeight: 'heading',
        fontWeight: 'heading',
        fontSize: 2,
        paddingBottom: 4,
      },
      h5: {
        color: 'text',
        fontFamily: 'heading',
        lineHeight: 'heading',
        fontWeight: 'heading',
        fontSize: 1,
        paddingBottom: 4,
      },
      h6: {
        color: 'text',
        fontFamily: 'heading',
        lineHeight: 'heading',
        fontWeight: 'heading',
        fontSize: 0,
        paddingBottom: 4,
      },
      p: {
        fontWeight: 'body',
        fontSize: 1,
        paddingBottom: 3,
      },
      small: {
        fontWeight: 'body',
        fontSize: 0,
        paddingBottom: 3,
      },
      a: {
        color: 'primary',
        '&:visited': {
          color: 'primary',
        },
      },
      ul: {
        fontWeight: 'body',
        fontSize: 1,
        paddingBottom: 3,
      },
      pre: {
        fontFamily: 'monospace',
        overflowX: 'auto',
        code: {
          color: 'inherit',
        },
      },
      code: {
        fontFamily: 'monospace',
        fontSize: 'inherit',
      },
      table: {
        width: '100%',
        borderCollapse: 'separate',
        borderSpacing: 0,
      },
      th: {
        textAlign: 'left',
        borderBottomStyle: 'solid',
      },
      td: {
        textAlign: 'left',
        borderBottomStyle: 'solid',
      },
      img: {
        maxWidth: '100%',
      },
      blockquote: {
        borderLeft: '2px solid',
        borderColor: 'inherit',
        marginLeft: '0',
        paddingLeft: '2rem',
      },
    },
  },
};
