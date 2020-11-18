/** @jsx jsx */

import React from 'react' //eslint-disable-line
import { jsx, Styled } from 'theme-ui'
import styled from '@emotion/styled'
import { useSiteMetadata } from '../hooks/use-site-metadata'
import { MDXRenderer } from 'gatsby-plugin-mdx'

const Wrapper = styled.section`
  position: relative;
  width: calc(100% - 96px);
  max-width: ${props => props.theme.sizes.maxWidth};
  flex-grow: 1;
  margin: 16px auto;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  @media screen and (min-width: 1281px) {
    width: calc(100% - 576px);
    margin: 64px auto;
  }
`

const Footer = () => {
  const { contentfulMeta } = useSiteMetadata()

  return (
    <Wrapper>
      <div sx={{ mb: '10vh' }}>
        <MDXRenderer>{contentfulMeta.footer.childMdx.body}</MDXRenderer>
      </div>

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
    </Wrapper>
  )
}

export default Footer
