import React from 'react'
import { Global } from '@emotion/core'
import { GlobalStyles } from '../styles/globalStyles.js'
import { motion, AnimatePresence } from 'framer-motion'

import Helmet from './Helmet'
import Menu from '../components/Menu'
import Footer from '../components/Footer'

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

const Layout = ({ children, location }) => {
  return (
    <>
      <Helmet />
      <Global styles={GlobalStyles} />

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
              <Footer />
          </motion.main>
        </AnimatePresence>
      
      </div>
    </>
  )
}

export default Layout
