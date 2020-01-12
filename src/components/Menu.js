/** @jsx jsx */

import React from 'react' //eslint-disable-line

import { jsx, useColorMode } from 'theme-ui'

import { Link } from 'gatsby'

import Headroom from 'react-headroom'

import { Wrapper, Content, Button } from '../utils/Styled'

import { Sun, Moon, Random } from '../utils/Icons'

import Logo from '../components/Logo'

const Menu = props => {
  const modes = ['light', 'dark', 'random']

  const [mode, setMode] = useColorMode() //eslint-disable-line
  return (
    <Headroom
      style={{
        position: 'fixed',
        zIndex: '300',
        transition: 'all .5s ease-in-out',
      }}
    >
      <Wrapper>
        <Content className="menu">
          <Logo />
          <div>
            <p className="mobileBlock">
              <Link
                sx={{
                  variant: 'styles.a',
                  verticalAlign: 'top',
                  textDecoration: 'none',
                }}
                to="/"
              >
                Galleries
              </Link>
              &nbsp;&nbsp;&nbsp;
              <Link
                sx={{
                  variant: 'styles.a',
                  verticalAlign: 'top',
                  textDecoration: 'none',
                }}
                to="/blog"
              >
                Blog
              </Link>
              &nbsp;&nbsp;&nbsp;
              <Link
                sx={{
                  variant: 'styles.a',
                  verticalAlign: 'top',
                  textDecoration: 'none',
                }}
                to="/contact"
                className="hide-inline"
              >
                Contact
              </Link>
            </p>
            <Button
              className="colorToggle"
              onClick={e => {
                const light = modes[0]
                setMode(light)
              }}
            >
              <Sun />
            </Button>
            <Button
              className="colorToggle"
              onClick={e => {
                const dark = modes[1]
                setMode(dark)
              }}
            >
              <Moon />
            </Button>
            <Button
              className="colorToggle"
              onClick={e => {
                const random = modes[2]
                setMode(random)
              }}
            >
              <Random />
            </Button>
          </div>
        </Content>
      </Wrapper>
    </Headroom>
  )
}

export default Menu
