/** @jsx jsx */

import React from 'react' //eslint-disable-line
import { jsx, Styled } from 'theme-ui'
import styled from '@emotion/styled'

const Wrapper = styled.section`
  position: relative;
  width: calc(100% - 96px);

  max-width: ${props => props.theme.sizes.maxWidth};
  flex-grow: 1;
  margin: 16px auto;
  @media screen and (min-width: 1281px) {
    width: calc(100% - 576px);
    margin: 64px auto;
  }
`

const List = styled.ul`
  display: flex;
  flex-flow: row wrap;
  justify-content: space-between;
  align-items: flex-start;
  width: 100%;
  li {
    margin-bottom: 16px;
    @media screen and (min-width: 1281px) { 
      margin-bottom: 0;
  }
`

const Footer = () => (
  <Wrapper>
    <List>
      <Styled.li>
        © 2019 Matthias Jordan. All rights reserved.
        <br />
        Made with ♡ in California, USA
      </Styled.li>
      <Styled.li>
        <a
          href="https://www.contentful.com/"
          rel="nofollow noopener noreferrer"
          target="_blank"
        >
          <img
            src="https://images.ctfassets.net/fo9twyrwpveg/44baP9Gtm8qE2Umm8CQwQk/c43325463d1cb5db2ef97fca0788ea55/PoweredByContentful_LightBackground.svg"
            style={{ width: '100px' }}
            alt="Powered by Contentful"
          />
        </a>
      </Styled.li>
    </List>
  </Wrapper>
)

export default Footer
