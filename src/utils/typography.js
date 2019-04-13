import Typography from 'typography'

const typography = new Typography({
  title: 'Montserrat + Lato + Source Code',
  googleFonts: [
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
      styles: ['400'],
    },
  ],
  headerFontFamily: ['Montserrat', 'Helvetica', 'sans-serif'],
  bodyFontFamily: ['Lato', 'Helvetica', 'sans-serif'],

  headerWeight: 900,
  bodyWeight: 400,
  boldWeight: 900,
  overrideStyles: () => ({
    'pre[class*="language-"],code[class*="language-"]': {
      fontFamily: ['Source Code Pro', 'monospace'].join(','),
    },
  }),
})

const { rhythm, scale } = typography

// Hot reload typography in development.
if (process.env.NODE_ENV !== 'production') {
  typography.injectStyles()
}

export { rhythm, scale, typography as default }
