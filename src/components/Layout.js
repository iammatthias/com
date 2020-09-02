/** @jsx jsx */

import React, { useEffect } from 'react' //eslint-disable-line
import { jsx, ThemeProvider } from 'theme-ui'
import styled from '@emotion/styled'
import { Global } from '@emotion/core'
import Menu from '../components/Menu'
import Footer from '../components/Footer'
import FooterHero from '../components/FooterHero'
import { globalStyles } from '../styles/globalStyles.js'
import SEO from '../components/SEO'
import getShareImage from '@jlengstorf/get-share-image'
import Pullable from 'react-pullable'

import theme from 'gatsby-plugin-theme-ui'

import { MDXGlobalComponents } from '../gatsby-plugin-theme-ui/components'

const Root = styled.div`
  background: ${props => props.theme.colors.background};
  font-family: ${props => props.theme.fonts.body};
  height: 100%;
  padding: 0;
`

const Wrapper = styled.section`
  position: relative;
  width: calc(100% - 32px);
  max-width: ${props => props.theme.sizes.maxWidth};
  border: 1px solid;
  margin: 16px auto;
  z-index: 1;
  background: ${props => props.theme.colors.background};
  border-radius: 4px;
  @media screen and (min-width: 1281px) {
    width: calc(100% - 384px);
    margin: 64px auto;
    box-shadow: -5px -5px 100px ${props => props.theme.colors.background},
      25px 25px 100px ${props => props.theme.colors.shadow};
  }
  @media screen and (min-width: 1801px) {
    width: calc(100% - 256px);
  }
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
  description,
  ...props
}) => {
  function handleFirstTab(e) {
    if (e.keyCode === 9) {
      document.body.classList.add('user-is-tabbing')
    }
  }
  useEffect(() => window.addEventListener('keydown', handleFirstTab), [])

  const socialImage = getShareImage({
    title: title || 'I Am Matthias',
    cloudName: 'iammatthias',
    imagePublicID: 'iam/shareCardTemplate-v1',
    titleFont: 'Montserrat',
    titleExtraConfig: '_black',
    textColor: 'FFF8E7',
    titleLeftOffset: '96',
    titleBottomOffset: '96',
    titleFontSize: '72',
  })

  return (
    <Pullable
      onRefresh={() =>
        typeof window !== `undefined` ? window.location.reload() : null
      }
    >
      <ThemeProvider theme={theme} components={MDXGlobalComponents}>
        <Root className="siteRoot">
          <SEO
            title={title || 'I Am Matthias'}
            image={socialImage}
            description={description}
          />
          <Global styles={globalStyles} />
          <div className="siteContent" {...props}>
            <Wrapper
              id="main"
              sx={{
                padding: [0, 3, 4, 5],
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
            {location === '/' && <FooterHero />}
          </div>
          <Footer />
        </Root>
      </ThemeProvider>
    </Pullable>
  )
}

export default Layout
