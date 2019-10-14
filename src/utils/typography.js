// @flow
import Typography from 'typography'

const typography = new Typography({
  title: 'Montserrat + Lora + Source Code',
  baseFontSize: '18px',
  baseLineHeight: 1.4,
  googleFonts: [
    {
      name: 'Lora',
      styles: ['400', '700'],
    },

    {
      name: 'Montserrat',
      styles: ['400', '700'],
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
