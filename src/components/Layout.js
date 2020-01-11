import React from 'react'
import { Global } from '@emotion/core'
import { GlobalStyles } from '../styles/globalStyles.js'

import Helmet from './Helmet'
import Menu from '../components/Menu'
import Footer from '../components/Footer'

const Layout = ({ children }) => {
  return (
    <>
      <Helmet />
      <Global styles={GlobalStyles} />

      <div className="siteRoot">
        <Menu />
        {children}
        <Footer />
      </div>
    </>
  )
}

export default Layout
