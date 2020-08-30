import randomCombo from 'random-a11y-combo'

const [palettebackground, paletteColor] = randomCombo()

function LightenDarkenColor(col, amt) {
  var usePound = false

  if (col[0] === '#') {
    col = col.slice(1)
    usePound = true
  }

  var num = parseInt(col, 16)

  var r = (num >> 16) + amt

  if (r > 255) r = 255
  else if (r < 0) r = 0

  var b = ((num >> 8) & 0x00ff) + amt

  if (b > 255) b = 255
  else if (b < 0) b = 0

  var g = (num & 0x0000ff) + amt

  if (g > 255) g = 255
  else if (g < 0) g = 0

  return (usePound ? '#' : '') + (g | (b << 8) | (r << 16)).toString(16)
}

var randomHighlight = LightenDarkenColor(palettebackground, 40)
var randomShadow = LightenDarkenColor(palettebackground, -40)

export default {
  useColorSchemeMediaQuery: true,
  initialColorModeName: 'dark',
  colors: {
    modes: {
      light: {
        background: '#fff8e7',
        text: '#101A1F',
        primary: '#101A1F',
        secondary: '#FFFBF4',
        tertiary: '#f3f3f3',
        highlight: '#5b8bf7',
        shadow: '#BAB5A9',
      },
      dark: {
        background: '#101A1F',
        text: '#fff8e7',
        primary: '#fff8e7',
        secondary: '#364A54',
        tertiary: '#101A1F',
        highlight: '#5b8bf7',
        shadow: '#100B00',
      },
      random: {
        background: palettebackground,
        text: paletteColor,
        primary: paletteColor,
        secondary: randomHighlight,
        muted: paletteColor,
        shadow: randomShadow,
      },
    },
  },
  sizes: {
    maxWidth: '100vw',
    maxWidthCentered: '900px',
  },
  responsive: {
    small: '35rem',
    medium: '50rem',
    large: '70rem',
  },
  space: [0, 4, 8, 16, 32, 64, 128, 256, 512],
  fonts: {
    body: '"Crimson Text"',
    heading: 'Montserrat',
    monospace: 'Inconsolata, monospace',
  },
  fontSizes: [12, 14, 16, 20, 24, 32, 48, 64, 96],
  fontWeights: {
    body: 200,
    heading: 900,
    bold: 700,
  },
  lineHeights: {
    body: 1.5,
    heading: 1.125,
  },

  styles: {
    root: {
      fontFamily: 'body',
      lineHeight: 'body',
      fontWeight: 'body',
      color: 'text',
    },
    h1: {
      fontFamily: 'heading',
      lineHeight: 'heading',
      fontWeight: 'heading',
      fontSize: 5,
      mb: 3,
    },
    h2: {
      fontFamily: 'heading',
      lineHeight: 'heading',
      fontWeight: 'heading',
      fontSize: 4,
      mb: 3,
    },
    h3: {
      fontFamily: 'heading',
      lineHeight: 'heading',
      fontWeight: 'heading',
      fontSize: 3,
      mb: 3,
    },
    h4: {
      fontFamily: 'heading',
      lineHeight: 'heading',
      fontWeight: 'heading',
      fontSize: 2,
      mb: 3,
    },
    h5: {
      fontFamily: 'heading',
      lineHeight: 'heading',
      fontWeight: 'heading',
      fontSize: 1,
      mb: 3,
    },
    h6: {
      fontFamily: 'heading',
      lineHeight: 'heading',
      fontWeight: 'heading',
      fontSize: 0,
      mb: 3,
    },
    p: {
      fontFamily: 'body',
      fontWeight: 'body',
      lineHeight: 'body',
      fontSize: 2,
      mb: 3,
    },

    ul: {
      fontFamily: 'body',
      fontWeight: 'body',
      lineHeight: 'body',
      fontSize: 2,
      mb: 3,
    },
    ol: {
      fontFamily: 'body',
      fontWeight: 'body',
      lineHeight: 'body',
      fontSize: 2,
      mb: 3,
    },
    li: {
      fontFamily: 'body',
      fontWeight: 'body',
      lineHeight: 'body',
      fontSize: 2,
      mb: 3,
    },
    a: {
      color: 'inherit',
      fontWeight: 'heading',
      textDecoration: 'none',
    },
    blockquote: {
      paddingLeft: 3,
      borderLeft: '1px solid',
      borderColor: 'inherit',
      p: {
        marginBottom: 0,
      },
    },
    pre: {
      fontFamily: 'monospace',
      overflowX: 'auto',
      p: 3,
      mb: 0,
      border: '1px solid',
      borderColor: 'inherit',
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

    input: {
      background: 'secondary',
      color: 'text',
    },
    textArea: {
      background: 'secondary',
      color: 'background',
    },
  },
}
