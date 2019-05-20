// @flow
import Typography from 'typography'

const typography = new Typography({
  title: 'Montserrat + Lato + Source Code',
  baseFontSize: '18px',
  baseLineHeight: 1.4,
  googleFonts: [
    {
      name: 'Playfair Display',
      styles: ['900', '900i'],
    },
    {
      name: 'Montserrat',
      styles: ['900', '900i'],
    },
    {
      name: 'Lato',
      styles: ['400', '900'],
    },
    {
      name: 'Source Code Pro',
      styles: ['400&display=swap'],
    },
  ],
})

const { rhythm, scale } = typography

// Hot reload typography in development.
if (process.env.NODE_ENV !== 'production') {
  typography.injectStyles()
}

export { rhythm, scale, typography as default }
