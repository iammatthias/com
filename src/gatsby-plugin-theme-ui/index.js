import randomCombo from 'random-a11y-combo'

const [paletteBackground, paletteColor] = randomCombo()

export default {
  useColorSchemeMediaQuery: true,
  colors: {
    text: '#fff8e7',
    background: '#140D00',
    muted: '#716b60',
    modes: {
      light: {
        text: '#140D00',
        background: '#fff8e7',
        muted: '#716b60',
      },
      dark: {
        text: '#fff8e7',
        background: '#140D00',
        muted: '#716b60',
      },
      random: {
        text: paletteColor,
        background: paletteBackground,
        muted: paletteColor,
      },
    },
  },
  responsive: {
    small: '22em',
    medium: '36em',
    large: '64em',
  },
  fonts: {
    body: 'system-ui, sans-serif',
    heading: 'system-ui, sans-serif',
    monospace: 'Menlo, monospace',
  },
  fontWeights: {
    body: 400,
    heading: 900,
    bold: 900,
  },
  lineHeights: {
    body: 1.5,
    heading: 1.125,
  },
  fontSizes: [12, 14, 16, 20, 24, 32, 48, 64, 72],
  space: [0, 4, 8, 16, 32, 64, 128, 256, 512],
  styles: {
    root: {
      fontFamily: 'body',
      lineHeight: 'body',
      fontWeight: 'body',
    },
    h1: {
      color: 'text',
      fontFamily: 'heading',
      lineHeight: 'heading',
      fontWeight: 'heading',
      fontSize: 5,
      marginBottom: 4,
    },
    h2: {
      color: 'text',
      fontFamily: 'heading',
      lineHeight: 'heading',
      fontWeight: 'heading',
      fontSize: 4,
      marginBottom: 3,
    },
    h3: {
      color: 'text',
      fontFamily: 'heading',
      lineHeight: 'heading',
      fontWeight: 'heading',
      fontSize: 3,
      marginBottom: 3,
    },
    h4: {
      color: 'text',
      fontFamily: 'heading',
      lineHeight: 'heading',
      fontWeight: 'heading',
      fontSize: 2,
      marginBottom: 2,
    },
    h5: {
      color: 'text',
      fontFamily: 'heading',
      lineHeight: 'heading',
      fontWeight: 'heading',
      fontSize: 1,
      marginBottom: 1,
    },
    h6: {
      color: 'text',
      fontFamily: 'heading',
      lineHeight: 'heading',
      fontWeight: 'heading',
      fontSize: 0,
    },
    p: {
      color: 'text',
      fontFamily: 'body',
      fontWeight: 'body',
      lineHeight: 'body',
      marginBottom: 2,
    },
    a: {
      color: 'text',
      fontFamily: 'heading',
      lineHeight: 'heading',
      fontWeight: 'heading',
      fontSize: 2,
      ':hover, :focus, :visited': {
        color: 'text',
      },
    },
    pre: {
      fontFamily: 'monospace',
      overflowX: 'auto',
      border: '2px solid',
      borderColor: 'text',
      padding: 3,
      code: {
        color: 'text',
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
    ul: {
      listStyle: 'circle outside none',
      marginLeft: '1rem',
    },
  },
}
