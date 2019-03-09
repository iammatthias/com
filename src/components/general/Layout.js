import React from 'react'
import { ThemeProvider } from 'styled-components'
import posed, { PoseGroup } from 'react-pose'
import Helmet from 'react-helmet'
import theme from '../../styles/theme'
import GlobalStyle from '../../styles/global'
import Menu from '../general/Menu'

const transitionDuration = 150
const transitionDelay = 50

const Transition = posed.div({
  enter: {
    opacity: 1,
    transition: {
      duration: transitionDuration,
    },
    delay: transitionDelay,
    beforeChildren: true,
  },
  exit: {
    opacity: 0,
    transition: {
      duration: transitionDuration,
    },
  },
})

const Layout = ({ children, ...props }) => {
  return (
    <ThemeProvider theme={theme}>
      <div className="siteRoot">
        <Helmet>
          <html lang="en" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link rel="icon" href="/logos/logo-512.png" />
          <link rel="apple-touch-icon" href="/logos/logo-512.png" />
        </Helmet>
        <GlobalStyle />
        <Menu />
        <PoseGroup>
          <Transition key={props.location.pathname}> {children} </Transition>
        </PoseGroup>
      </div>
    </ThemeProvider>
  )
}

export default Layout
