/** @jsxImportSource theme-ui */

// spicy

import { keyframes } from '@emotion/react'

export default function Spicy({ children, props }) {
  const gradient = keyframes({ to: { backgroundPosition: '200% center' } })
  return (
    <span
      {...props}
      sx={{
        backgroundImage:
          'linear-gradient(to right, #77f, #33d0ff, #25ffbb, #33d0ff, #77f)',
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
