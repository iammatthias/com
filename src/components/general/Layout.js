import React from 'react'
import { ThemeProvider } from 'styled-components'
import { motion, AnimatePresence } from 'framer-motion'
import theme from '../../styles/theme'
import _Helmet from '../general/Helmet'
import Styles from '../general/Styles'
import Menu from '../general/Menu'
import Footer from '../general/Footer'

if (typeof window !== 'undefined') {
  // eslint-disable-next-line global-require
  require('smooth-scroll')('a[href*="#"]')
}

const duration = 0.5

const variants = {
  initial: {
    opacity: 0,
  },
  enter: {
    opacity: 1,
    transition: {
      duration: duration,
      delay: duration,
      when: 'beforeChildren',
    },
  },
  exit: {
    opacity: 0,
    transition: { duration: duration },
  },
}

const Layout = ({ children }) => {
  return (
    <>
      <_Helmet />
      <Styles />
      <ThemeProvider theme={theme}>
        <div className="siteRoot">
          <Menu />
          <AnimatePresence>
            <motion.main
              key={location.pathname}
              variants={variants}
              initial="initial"
              animate="enter"
              exit="exit"
            >
              {children}
            </motion.main>
          </AnimatePresence>
          <Footer />
        </div>
      </ThemeProvider>
    </>
  )
}

export default Layout
