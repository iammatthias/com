import { styled } from '@stitches/react'
import Nav from './blocks/nav'
import Box from './primitives/box'
import Background from './joy/bg'

export default function Layout({ children }: any) {
  return (
    <Box
      css={{
        margin: '0 auto',
        padding: '1rem',
        'article, .nav': {
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr 6fr 1fr 1fr 1fr',
          gridTemplateRows: 'auto',
          gridGap: '1rem',
          '> *': {
            gridColumn: '1 / 8',
          },
        },
        '@bp1': {
          'article, .nav': {
            '> *': {
              gridColumn: '1 / 8',
            },
          },
        },
        '@bp2': {
          'article, .nav': {
            '> *': {
              gridColumn: '2 / 7',
            },
          },
        },
        '@bp3': {
          'article, .nav': {
            '> *': {
              gridColumn: '3 / 6',
            },
          },
        },
        '@bp4': {
          'article, .nav': {
            '> *': {
              gridColumn: '4 / 5',
            },
          },
        },
      }}
    >
      <Nav />
      {children}
      {/* <Background /> */}
    </Box>
  )
}
