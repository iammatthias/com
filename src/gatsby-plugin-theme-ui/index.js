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

var randomHighlight = LightenDarkenColor(palettebackground, 20)
var randomShadow = LightenDarkenColor(paletteColor, -20)

export default {
  useColorSchemeMediaQuery: true,
  initialColorModeName: 'light',
  colors: {
    modes: {
      light: {
        background: '#F5F2F2',
        text: '#141919',
        blue: '#6699CC',
        yellow: '#FAC805',
        red: '#FF3864',
        light: '#FAFAFA',
        shadow: '#647882',
      },
      dark: {
        background: '#141919',
        text: '#F5F2F2',
        blue: '#6699CC',
        yellow: '#FAC805',
        red: '#FF3864',
        light: '#FAFAFA',
        shadow: '#647882',
      },
      random: {
        background: palettebackground,
        text: paletteColor,
        blue: randomHighlight,
        yellow: randomShadow,
        red: randomHighlight,
        light: randomShadow,
        shadow: '#647882',
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
    cursive: 'Pacifico, cursive',
  },
  fontSizes: [12, 14, 16, 20, 24, 32, 48, 64, 96],
  fontWeights: {
    body: 200,
    heading: 900,
    bold: 700,
  },
  lineHeights: {
    body: 1.75,
    heading: 2,
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
      color: 'text',
      fontWeight: 'heading',
      textDecoration: 'none',
      fontFamily: 'inherit',
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
      borderRadius: '4px',
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
