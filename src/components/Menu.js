/** @jsx jsx */

import React, { useContext } from 'react' //eslint-disable-line
import { jsx, useColorMode, Styled } from 'theme-ui'
import { Link } from 'gatsby'
import styled from '@emotion/styled'
import { useSiteMetadata } from '../hooks/use-site-metadata'
import Logo from './Logo'
import { Sun, Moon, Random } from './Icons'
import PostDetails from './PostDetails'
import TagList from '../components/TagList'

const Header = styled.header`
  width: 100%;
  padding: 5em 1.5em;
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: 1fr;
  grid-gap: 1em;
  @media screen and (min-width: ${props => props.theme.responsive.small}) {
    grid-template-columns: 6fr 3fr;
    grid-template-rows: 1fr;
  }
`
const Nav = styled.nav`
  width: 100%;
  max-width: ${props => props.theme.sizes.maxWidth};
  margin: 0 auto;
  ul {
    margin: 2em 0 0;
  }

  li {
    margin: 0 1em 1em 0;
    width: auto;
    display: inline-block;
    @media screen and (min-width: ${props => props.theme.responsive.small}) {
      margin: 1em 0;
      display: block;
    }
  }

  a {
    text-decoration: none;
    color: ${props => props.theme.colors.text};
    font-weight: 600;
    transition: all 0.2s;
  }
`

const Menu = ({
  props,
  blurb,
  title,
  date,
  timeToRead,
  tags,
  basePath,
  location,
}) => {
  const modes = ['light', 'dark', 'random']

  const [mode, setMode] = useColorMode() //eslint-disable-line
  const { menuLinks } = useSiteMetadata()

  return (
    <Header>
      <Nav>
        <Logo />
        <Styled.h4 sx={{ margin: '1em 0' }}>I Am Matthias</Styled.h4>
        <Styled.h5 sx={{ margin: '1em 0', fontWeight: 'normal' }}>
          📸 & Digital Marketer
        </Styled.h5>
        <Styled.ul>
          {menuLinks.map(link => (
            <Styled.li key={link.name}>
              <Link to={link.slug}>{link.name}</Link>
            </Styled.li>
          ))}

          <Styled.li>
            <button
              onClick={e => {
                const light = modes[0]
                setMode(light)
              }}
              aria-label="Light Mode"
              title="Light Mode"
              sx={{ margin: '0 1em 0 0', padding: '0' }}
            >
              <Sun />
            </button>
            <button
              onClick={e => {
                const dark = modes[1]
                setMode(dark)
              }}
              aria-label="Dark Mode"
              title="Dark Mode"
              sx={{ margin: '0 1em 0 0', padding: '0' }}
            >
              <Moon />
            </button>
            <button
              onClick={e => {
                const random = modes[2]
                setMode(random)
              }}
              aria-label="Random A11Y Color Pair Mode"
              title="Random A11Y Color Pair Mode"
              sx={{ margin: '0 1em 0 0', padding: '0' }}
            >
              <Random />
            </button>
          </Styled.li>
        </Styled.ul>
      </Nav>
      <Nav sx={{ marginTop: 'auto', marginBottom: '2em', px: [0, 0, 0, 0, 3] }}>
        {location === '/' && (
          <>
            <Styled.p sx={{ textAlign: ['left', 'right'] }}>
              Based in Long Beach with my wife and daughter. We have a good life
              together.
            </Styled.p>
            <Styled.p sx={{ textAlign: ['left', 'right'] }}>
              Currently at Aspiration. Previously at Surf Air and General
              Assembly.
            </Styled.p>
          </>
        )}
        {title && location !== '/' && (
          <Styled.h1 sx={{ textAlign: ['left', 'right'], mb: '.5em' }}>
            {title}
          </Styled.h1>
        )}
        {blurb && location !== '/' && (
          <>
            <Styled.p sx={{ textAlign: ['left', 'right'] }}>{blurb}</Styled.p>
          </>
        )}
        {date && location !== '/' && (
          <PostDetails
            date={date}
            timeToRead={timeToRead}
            location={location}
          />
        )}
        {tags && (
          <TagList
            tags={tags}
            basePath={basePath}
            sx={{ maxWidth: theme => `${theme.sizes.maxWidthCentered}` }}
          />
        )}
      </Nav>
    </Header>
  )
}

export default Menu
