import { styled } from '@stitches/react'
import Box from './primitives/box'
import { motion } from 'framer-motion'
import { useRouter } from 'next/router'

export default function Layout({ children }: any) {
  const router = useRouter()
  const variants = {
    hidden: { opacity: 0, x: 0, y: 0 },
    enter: { opacity: 1, x: 0, y: 0 },
    exit: { opacity: 0, x: 0, y: 0 },
  }
  return (
    <Box
      css={{
        margin: '0 auto',
        padding: '1rem',
        article: {
          margin: '3rem auto',
        },
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
      <motion.main
        initial="hidden"
        animate="enter"
        exit="exit"
        variants={variants}
        key={router.asPath}
        transition={{ duration: 0.2, ease: 'easeInOut', type: 'tween' }}
      >
        {children}
      </motion.main>
    </Box>
  )
}
