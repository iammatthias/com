/** @jsx jsx */

import React, { useEffect } from 'react' //eslint-disable-line
import { jsx, ThemeProvider } from 'theme-ui'
import styled from '@emotion/styled'
import { Global } from '@emotion/core'
import Menu from '../components/Menu'
import Footer from '../components/Footer'
import { globalStyles } from '../styles/globalStyles.js'
// import getShareImage from '@jlengstorf/get-share-image'

import theme from 'gatsby-plugin-theme-ui'

import { MDXGlobalComponents } from '../components/MDX'

const Root = styled.div`
  background: ${props => props.theme.colors.background};
  font-family: ${props => props.theme.fonts.body};
  height: 100%;
`

const Wrapper = styled.section`
  width: 100%;
  max-width: ${props => props.theme.sizes.maxWidth};
  flex-grow: 1;
  box-shadow: -5px -5px 100px ${props => props.theme.colors.background},
    25px 25px 100px ${props => props.theme.colors.shadow};
`

const Layout = ({
  children,
  blurb,
  title,
  date,
  timeToRead,
  tags,
  basePath,
  location,
  ...props
}) => {
  function handleFirstTab(e) {
    if (e.keyCode === 9) {
      document.body.classList.add('user-is-tabbing')
    }
  }
  useEffect(() => window.addEventListener('keydown', handleFirstTab), [])

  // const socialImage = getShareImage({
  //   title: 'I Am Matthias' || title,
  //   cloudName: 'iammatthias',
  //   imagePublicID: 'lwj/blog-post-card',
  //   titleFont: 'Montserrat',
  //   titleExtraConfig: '_black',
  //   textColor: 'FFF8E7',
  //   titleLeftOffset: '96',
  //   titleBottomOffset: '96',
  //   titleFontSize: '72',
  // })
  // console.log(socialImage)

  return (
    <ThemeProvider theme={theme} components={MDXGlobalComponents}>
      <Root className="siteRoot">
        <Global styles={(theme => theme.styles.Global(theme), globalStyles)} />
        <div className="siteContent" {...props}>
          <Wrapper
            id="main"
            sx={{
              padding: [0, 3, 4, 5],
              mt: [0, 3, 4, 5],
              mx: 'auto',
              border: ['0 solid', '1px solid'],
              borderColor: 'text',
            }}
          >
            <Menu
              blurb={blurb}
              title={title}
              date={date}
              timeToRead={timeToRead}
              tags={tags}
              basePath={basePath}
              location={location}
            />

            {children}
          </Wrapper>
        </div>

        <Footer />
      </Root>
    </ThemeProvider>
  )
}

export default Layout
