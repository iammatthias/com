/** @jsxImportSource theme-ui */

// spicy

import { keyframes } from '@emotion/react'

export default function Spicy({ children, props }) {
  const gradient = keyframes({
    from: {
      backgroundPosition: '200% top',
    },
    to: {
      backgroundPosition: '200% bottom',
    },
  })
  return (
    <span
      {...props}
      sx={{
        backgroundImage: theme =>
          `linear-gradient(to right, ${theme.colors.red[4]}, ${theme.colors.blue[4]}, ${theme.colors.green[4]}, ${theme.colors.magenta[4]})`,
        backgroundSize: '200% auto',
        backgroundClip: 'text',
        textFillColor: 'transparent',
        animation: `${gradient} 4s linear infinite`,
        fontFamily: 'heading',
      }}
    >
      {children}
    </span>
  )
}
