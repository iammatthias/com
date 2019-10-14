import React from 'react'
import { ThemeProvider } from 'styled-components'
import Helmet from 'react-helmet'
import theme from '../../styles/theme'
import Reset from '../../styles/reset'
import ColorStyle from '../../styles/colors'
import GlobalStyle from '../../styles/global'
import ArticleStyle from '../../styles/article'
import TextStyle from '../../styles/text'
import Menu from '../general/Menu'

if (typeof window !== 'undefined') {
  // eslint-disable-next-line global-require
  require('smooth-scroll')('a[href*="#"]')
}

const Layout = ({ children }) => {
  return (
    <>
      <Reset />
      <ColorStyle />
      <TextStyle />
      <GlobalStyle />
      <ArticleStyle />
      <ThemeProvider theme={theme}>
        <div className="siteRoot">
          <Helmet>
            <html lang="en" />
            <meta name="apple-mobile-web-app-capable" content="yes" />
            <meta
              name="apple-mobile-web-app-status-bar-style"
              content="black"
            />
            <link
              rel="apple-touch-startup-image"
              media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3)"
              href="/splash/launch-1242x2688.png"
            />

            <link
              rel="apple-touch-startup-image"
              media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2)"
              href="/splash/launch-828x1792.png"
            />

            <link
              rel="apple-touch-startup-image"
              media="(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)"
              href="/splash/launch-1125x2436.png"
            />

            <link
              rel="apple-touch-startup-image"
              media="(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3)"
              href="/splash/launch-1242x2208.png"
            />

            <link
              rel="apple-touch-startup-image"
              media="(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)"
              href="/splash/launch-750x1334.png"
            />

            <link
              rel="apple-touch-startup-image"
              media="(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2)"
              href="/splash/launch-2048x2732.png"
            />

            <link
              rel="apple-touch-startup-image"
              media="(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2)"
              href="/splash/launch-1668x2388.png"
            />

            <link
              rel="apple-touch-startup-image"
              media="(device-width: 834px) and (device-height: 1112px) and (-webkit-device-pixel-ratio: 2)"
              href="/splash/launch-1668x2224.png"
            />

            <link
              rel="apple-touch-startup-image"
              media="(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2)"
              href="/splash/launch-1536x2048.png"
            />
          </Helmet>

          <Menu />
          {children}
        </div>
      </ThemeProvider>
    </>
  )
}

export default Layout
