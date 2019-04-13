import React from 'react'
import { ThemeProvider } from 'styled-components'
import posed, { PoseGroup } from 'react-pose'
import Helmet from 'react-helmet'
import theme from '../../styles/theme'
import GlobalStyle from '../../styles/global'
import Menu from '../general/Menu'
import { pageFade } from '../../styles/pose'

const Main = posed('main')(pageFade)

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
        <PoseGroup animateOnMount preEnterPose="initial">
          <Main key={props.location.pathname} id="content" role="main">
            {children}
          </Main>
        </PoseGroup>
      </div>
    </ThemeProvider>
  )
}

export default Layout
