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
        },
        '@bp2': {
          article: {
            '> *': {
              gridColumn: '2 / 7',
            },
          },
        },
        '@bp3': {
          article: {
            '> *': {
              gridColumn: '3 / 6',
            },
          },
        },
        '@bp4': {
          article: {
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
        transition={{
          delay: 0,
          duration: 0.618,
          ease: 'easeInOut',
          type: 'tween',
        }}
      >
        {children}
      </motion.main>
    </Box>
  )
}
