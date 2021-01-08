export default {
  useColorSchemeMediaQuery: true,
  initialColorModeName: 'light',
  space: [0, 4, 8, 16, 32, 64, 128, 256, 512],
  fonts: {
    body: 'Playfair Display, system-ui, sans-serif',
    heading: 'Cormorant Garamond, serif',
    monospace: 'Inconsolata, Menlo, monospace',
    cursive: 'Lobster, cursive',
  },
  fontSizes: [12, 16, 24, 36, 54, 81, 122, 182, 264],
  fontWeights: {
    body: 400,
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
        text: '#120602',
        background: '#DBE1E1',
        primary: '#DB8A74',
      },
      dark: {
        text: '#DBE1E1',
        background: '#120602',
        primary: '#DB8A74',
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
        fontSize: 1,
        paddingBottom: 3,
      },
      a: {
        color: 'primary',
        '&:visited': {
          color: 'primary',
        },
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
    },
  },
};
