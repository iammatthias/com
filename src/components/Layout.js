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
  padding: 16px;
`

const Wrapper = styled.section`
  position: relative;
  width: 100%;
  max-width: ${props => props.theme.sizes.maxWidth};
  flex-grow: 1;
  box-shadow: -5px -5px 100px ${props => props.theme.colors.background},
    25px 25px 100px ${props => props.theme.colors.shadow};
  border: 1px solid;
  margin: 16px;
  z-index: 1;
  background: ${props => props.theme.colors.background};
  @media screen and (min-width: 1281px) {
    margin-top: 64px;
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
          <Global
            styles={(theme => theme.styles.Global(theme), globalStyles)}
          />
          <div className="siteContent" {...props}>
            <Wrapper
              id="main"
              sx={{
                padding: [0, 3, 4, 5],
                mx: 'auto',
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
            {location === '/' && (
              <FooterHero
                sx={{
                  top: ['0', '0', '0', '-10rem'],
                  position: 'relative',
                  zIndex: '0',
                  m: [0, 0, 0, 5],
                  display: ['block', 'block', 'block'],
                }}
              />
            )}
          </div>
          <Footer />
        </Root>
      </ThemeProvider>
    </Pullable>
  )
}

export default Layout
