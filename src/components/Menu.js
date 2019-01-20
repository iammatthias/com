import React from 'react'
import Link from 'gatsby-link'
import styled from 'styled-components'
import { slide as Menu } from 'react-burger-menu'
import Social from './Social'

import { Heading, Box } from 'rebass'

const StyledLink = styled(Link)`
  text-decoration: none;
`

const Navigation = () => {
  return (
    <nav>
      <Menu
        right
        isOpen={false}
        pageWrapId={'page-wrap'}
        outerContainerId={'outer-container'}
        noOverlay
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
    </nav>
  )
}

export default Navigation
