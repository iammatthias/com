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
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr 6fr 1fr 1fr 1fr',
        gridTemplateRows: 'auto',
        gridGap: '1rem',
        article: {
          gridColumn: '1 / 8',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr 6fr 1fr 1fr 1fr',
          gridTemplateRows: 'auto',
          gridGap: '1rem',
          '> *': {
            gridColumn: '1 / 8',
          },
        },
        '@bp1': {
          article: {
            '> *': {
              gridColumn: '1 / 8',
            },
          },
          '.nav': {
            gridColumn: '1 / 8',
          },
        },
        '@bp2': {
          article: {
            '> *': {
              gridColumn: '2 / 7',
            },
          },
          '.nav': {
            gridColumn: '2 / 7',
          },
        },
        '@bp3': {
          article: {
            '> *': {
              gridColumn: '3 / 6',
            },
          },
          '.nav': {
            gridColumn: '3 / 6',
          },
        },
        '@bp4': {
          article: {
            '> *': {
              gridColumn: '4 / 5',
            },
          },
          '.nav': {
            gridColumn: '4 / 5',
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
