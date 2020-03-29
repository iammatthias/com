/** @jsx jsx */

import React, { useEffect } from 'react' //eslint-disable-line
import { jsx } from 'theme-ui'
import styled from '@emotion/styled'
import { Global } from '@emotion/core'
import Menu from '../components/Menu'
import Footer from '../components/Footer'
import { globalStyles } from '../styles/globalStyles.js'

const Root = styled.div`
  background: ${props => props.theme.colors.background};
  font-family: ${props => props.theme.fonts.body};
  height: 100%;
`

const Wrapper = styled.section`
  margin: 0 auto auto;
  width: 100%;
  max-width: ${props => props.theme.sizes.maxWidth};
  flex-grow: 1;
  box-shadow: -5px -5px 100px ${props => props.theme.colors.background},
    25px 25px 100px ${props => props.theme.colors.shadow};
`

const Layout = ({
  children,
location,
  blurb,
  title,
  date,
  timeToRead,
  tags,
  basePath,
  ...props
}) => {
  function handleFirstTab(e) {
    if (e.keyCode === 9) {
      document.body.classList.add('user-is-tabbing')
    }
  }
  useEffect(() => window.addEventListener('keydown', handleFirstTab), [])

  return (
    <Root className="siteRoot">
      <Global styles={globalStyles} />
      <div className="siteContent" {...props}>
        <Wrapper id="main" sx={{ padding: [0, 3, 4, 5] }}>
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
  )
}

export default Layout
