import React from 'react'
import Link from 'gatsby-link'
import styled from 'styled-components'
import { slide as Menu } from 'react-burger-menu'

import { FiHome, FiBook, FiUser } from 'react-icons/fi'

import Logo from '../general/Logo'

const SideMenu = styled.nav`
  display: none;
  @media screen and (min-width: 52em) {
    display: block;
  }
`

const SideMenuLink = styled(Link)`
  text-decoration: none;
  text-align: center;
  text-transform: uppercase;
  position: relative;
  display: block;
  margin: 0;
  padding: 0.6em 0 0.5em;
  color: var(--color-base) !important;
  text-shadow: 0.125em 0.125em var(--color-secondary) !important;
  &:hover {
    text-shadow: 0.125em 0.125em var(--color-secondary),
      0.25em 0.25em var(--color-tertiary),
      0.375em 0.375em var(--color-highlight), 0.5em 0.5em var(--color-accent) !important;
  }
  @media screen and (min-width: 52em) {
    padding: 0.5em 0;
    color: var(--color-accent);
    text-align: left;
  }
`
const MenuToggle = styled.h2`
  z-index: 900 !important;
  position: fixed;
  margin: 0.75em !important;
  top: 0;
  right: 0.5em;
  width: 3.5em;
  height: 3.5em;
  color: var(--color-secondary);
  cursor: pointer;
  text-shadow: 0.125em 0.125em var(--color-base);
  transition: all 0.3s;
  &:hover {
    text-shadow: 0.125em 0.125em var(--color-base),
      0.25em 0.25em var(--color-tertiary),
      0.375em 0.375em var(--color-highlight), 0.5em 0.5em var(--color-accent);
  }
`

export const BottomNavBar = styled.nav`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  background: var(--color-base);
  border-top: 3px solid var(--color-secondary);
  overflow: hidden;
  position: fixed;
  bottom: 0;
  width: 100%;
  z-index: 100;
  a {
    margin: 0;
    text-align: center;
    padding: 0.618rem 0 0;
    border-right: 3px solid var(--color-secondary);
    &:last-child {
      border-right: 0px solid var(--color-secondary);
    }
  }
  @media screen and (min-width: 52em) {
    display: none;
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
        <SideMenu>
          <MenuToggle onClick={() => this.toggleMenu()}>MENU</MenuToggle>
          <Menu
            right
            isOpen={this.state.menuOpen}
            pageWrapId={'page-wrap'}
            outerContainerId={'outer-container'}
            noOverlay
            customBurgerIcon={false}
          >
            <SideMenuLink
              to="/"
              className="linkAccentReset scopedLinkAccent"
              alt="IAM - Portfolio"
            >
              <h2>Portfolio</h2>
            </SideMenuLink>
            <SideMenuLink
              to="/blog"
              className="linkAccentReset scopedLinkAccent"
              alt="Blog Posts"
            >
              <h2>Blog</h2>
            </SideMenuLink>
            <SideMenuLink
              to="/contact"
              className="linkAccentReset scopedLinkAccent"
              alt="Contact Page"
            >
              <h2>Contact</h2>
            </SideMenuLink>

            <a
              href="https://www.contentful.com/"
              rel="nofollow noopener noreferrer"
              target="_blank"
              alt="Powered by Contentful"
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
              alt="Netlify"
            >
              <img
                src="https://cdn.netlify.com/1ed63b33731af09d707f4ecad8e805df905104ec/9f1a1/img/press/logos/full-logo-dark-simple.svg"
                style={{ width: '100px' }}
                alt="Netlify"
              />
            </a>
          </Menu>
        </SideMenu>
        <BottomNavBar justifyContent="space-evenly">
          <Link
            alt="IAM - Home"
            to="/"
            className="MenuTabBarHover"
            activeStyle={{
              boxShadow: 'inset 0 0.125em 0px 0px var(--color-tertiary)',
            }}
          >
            <FiHome size={'2em'} color={'var(--color-secondary)'} />
          </Link>

          <Link
            alt="Blog Posts"
            to="/blog"
            className="MenuTabBarHover"
            activeStyle={{
              boxShadow: 'inset 0 0.125em 0px 0px var(--color-tertiary)',
            }}
          >
            <FiBook size={'2em'} color={'var(--color-secondary)'} />
          </Link>

          <Link
            alt="Contact Page"
            to="/contact"
            className="MenuTabBarHover"
            activeStyle={{
              boxShadow: 'inset 0 0.125em 0px 0px var(--color-tertiary)',
            }}
          >
            <FiUser size={'2em'} color={'var(--color-secondary)'} />
          </Link>
        </BottomNavBar>
      </>
    )
  }
}

export default Navigation
