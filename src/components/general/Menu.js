import React from 'react'
import Link from 'gatsby-link'
import styled from 'styled-components'
import { slide as Menu } from 'react-burger-menu'

import { FiHome, FiBook, FiUser } from 'react-icons/fi'

import Logo from '../general/Logo'

import { Flex as Base, Heading, Box } from 'rebass'

const StyledLink = styled(Link)`
  text-decoration: none;
  text-align: center;
  color: var(--color-secondary);
  text-transform: uppercase;
  position: relative;
  display: block;
  margin: 0;
  padding: 0.6em 0 0.5em;
  @media screen and (min-width: 52em) {
    padding: 0.5em 0;
    color: var(--color-accent);
    text-align: left;
  }
`
const Icon = styled(Box)`
  z-index: 900 !important;
  position: fixed;
  margin: 0.75rem;
  top: 0;
  right: 0;
  width: 3.5em;
  height: 3.5em;
  background: url(/menu.svg);
  mix-blend-mode: soft-light;
  filter: invert(100%);
`

const NavBar = styled.nav`
  display: none;
  @media screen and (min-width: 52em) {
    display: block;
  }
`

export const MenuTabBar = styled(Base)`
  background: var(--color-base);
  border-top: 3px solid var(--color-tertiary);
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
    border-right: 2px solid var(--color-tertiary);
    &:last-child {
      border-right: 0px solid var(--color-tertiary);
    }
  }
`

class Navigation extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      menuOpen: false,
    }
  }
  handleStateChange(state) {
    this.setState({ menuOpen: state.isOpen })
  }
  closeMenu() {
    this.setState({ menuOpen: false })
  }
  toggleMenu() {
    this.setState({ menuOpen: !this.state.menuOpen })
  }

  render() {
    return (
      <>
        <Logo />
        <NavBar>
          <Icon onClick={() => this.toggleMenu()} />
          <Menu
            right
            isOpen={this.state.menuOpen}
            pageWrapId={'page-wrap'}
            outerContainerId={'outer-container'}
            noOverlay
            customBurgerIcon={false}
          >
            <StyledLink to="/">
              <Heading>Portfolio</Heading>
            </StyledLink>
            <StyledLink to="/blog">
              <Heading>Blog</Heading>
            </StyledLink>
            <StyledLink to="/contact">
              <Heading>Contact</Heading>
            </StyledLink>

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
                boxShadow: 'inset 0 4px 0px 0px var(--color-highlight)',
              }}
            >
              <FiHome size={'2em'} color={'var(--color-tertiary)'} />
            </StyledLink>
          </Box>
          <Box width={1 / 3}>
            <StyledLink
              to="/blog"
              activeStyle={{
                boxShadow: 'inset 0 4px 0px 0px var(--color-highlight)',
              }}
            >
              <FiBook size={'2em'} color={'var(--color-tertiary)'} />
            </StyledLink>
          </Box>
          <Box width={1 / 3}>
            <StyledLink
              to="/contact"
              activeStyle={{
                boxShadow: 'inset 0 4px 0px 0px var(--color-highlight)',
              }}
            >
              <FiUser size={'2em'} color={'var(--color-tertiary)'} />
            </StyledLink>
          </Box>
        </MenuTabBar>
      </>
    )
  }
}

export default Navigation
