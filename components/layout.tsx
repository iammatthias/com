import Box from './primitives/box'
import Grid from './primitives/grid'
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
    <Grid>
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
    </Grid>
  )
}
