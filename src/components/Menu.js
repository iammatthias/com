import React from 'react'
import Link from 'gatsby-link'
import styled from 'styled-components'
import { slide as Menu } from 'react-burger-menu'
import Social from './Social'

import { Flex as Base, Heading, Box } from 'rebass'

const StyledLink = styled(Link)`
  text-decoration: none;
  text-align: center;
  color: var(--color-accent);
  text-transform: uppercase;
  position: relative;
  display: block;
  margin: 0;
  padding: 0.5em 0;
  @media screen and (min-width: 52em) {
    text-align: left;
    color: var(--color-tertiary);
  }
`

const NavBar = styled.nav`
  display: none;
  @media screen and (min-width: 52em) {
    display: block;
  }
`

export const MenuTabBar = styled(Base)`
  background: var(--color-secondary);
  border-top: 3px solid var(--color-accent);
  overflow: hidden;
  position: fixed;
  bottom: 0;
  width: 100%;
  z-index: 100;
  display: flex;
  @media screen and (min-width: 52em) {
    display: none;
  }
  div {
    border-right: 2px solid var(--color-accent);
    &:last-child {
      border-right: 0px solid var(--color-accent);
    }
  }
`

const Navigation = () => {
  return (
    <>
      <NavBar>
        <Menu
          right
          isOpen={false}
          pageWrapId={'page-wrap'}
          outerContainerId={'outer-container'}
          noOverlay
        >
          <StyledLink to="/" activeStyle={{ color: 'var(--color-accent)' }}>
            <Heading>Portfolio</Heading>
          </StyledLink>
          <StyledLink to="/blog" activeStyle={{ color: 'var(--color-accent)' }}>
            <Heading>Blog</Heading>
          </StyledLink>
          <StyledLink
            to="/contact"
            activeStyle={{
              color: 'var(--color-accent)',
            }}
          >
            <Heading>Contact</Heading>
          </StyledLink>

          <Social />

          <Box>
            <a
              href="https://www.contentful.com/"
              rel="nofollow noopener noreferrer"
              target="_blank"
            >
              <img
                src="https://images.ctfassets.net/fo9twyrwpveg/7Htleo27dKYua8gio8UEUy/0797152a2d2f8e41db49ecbf1ccffdaa/PoweredByContentful_DarkBackground_MonochromeLogo.svg"
                style={{ width: '100px' }}
                alt="Powered by Contentful"
              />
            </a>
            <a
              href="https://www.netlify.com"
              rel="nofollow noopener noreferrer"
              target="_blank"
            >
              <img
                src="https://cdn.netlify.com/1ed63b33731af09d707f4ecad8e805df905104ec/9f1a1/img/press/logos/full-logo-dark-simple.svg"
                style={{ width: '100px' }}
                alt="Netlify"
              />
            </a>
          </Box>
        </Menu>
      </NavBar>
      <MenuTabBar justifyContent="space-evenly">
        <Box width={1 / 3}>
          <StyledLink
            to="/"
            activeStyle={{
              boxShadow: 'inset 0 8px 0px 0px var(--color-accent)',
            }}
          >
            <Heading>Home</Heading>
          </StyledLink>
        </Box>
        <Box width={1 / 3}>
          <StyledLink
            to="/blog"
            activeStyle={{
              boxShadow: 'inset 0 8px 0px 0px var(--color-accent)',
            }}
          >
            <Heading>Blog</Heading>
          </StyledLink>
        </Box>
        <Box width={1 / 3}>
          <StyledLink
            to="/contact"
            activeStyle={{
              boxShadow: 'inset 0 8px 0px 0px var(--color-accent)',
            }}
          >
            <Heading>Bio</Heading>
          </StyledLink>
        </Box>
      </MenuTabBar>
    </>
  )
}

export default Navigation
