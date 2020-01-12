import React from 'react'
import { Wrapper, Content } from '../utils/Styled'
import { MDXProvider } from '@mdx-js/react'
import MDXRenderer from 'gatsby-plugin-mdx/mdx-renderer'

import { useSiteMetadata } from '../utils/Metadata'

const Footer = () => {
  const { colophon } = useSiteMetadata()
  return (
    <Wrapper>
      <Content className="footer">
        <section>
          <MDXProvider>
            <MDXRenderer>{colophon.childMdx.body}</MDXRenderer>
          </MDXProvider>
          <p>
            <a
              href="https://www.contentful.com/"
              rel="nofollow noopener noreferrer"
              target="_blank"
              alt="Powered by Contentful"
            >
              <picture>
                <source
                  srcSet="https://images.ctfassets.net/fo9twyrwpveg/7F5pMEOhJ6Y2WukCa2cYws/398e290725ef2d3b3f0f5a73ae8401d6/PoweredByContentful_DarkBackground.svg"
                  media="(prefers-color-scheme: dark)"
                />
                <img
                  src="https://images.ctfassets.net/fo9twyrwpveg/44baP9Gtm8qE2Umm8CQwQk/c43325463d1cb5db2ef97fca0788ea55/PoweredByContentful_LightBackground.svg"
                  rel="contentful"
                  style={{ width: '100px' }}
                  alt="Powered by Contentful"
                />
              </picture>
            </a>
            &nbsp;&nbsp;&nbsp;
            <a
              href="https://www.netlify.com"
              rel="nofollow noopener noreferrer"
              target="_blank"
              alt="Netlify"
            >
              <picture>
                <source
                  srcSet="https://www.netlify.com/img/press/logos/full-logo-dark.svg"
                  media="(prefers-color-scheme: dark)"
                />
                <img
                  src="https://www.netlify.com/img/press/logos/full-logo-light.svg"
                  rel="netlify"
                  style={{ width: '100px' }}
                  alt="Netlify"
                />
              </picture>
            </a>
          </p>
        </section>
      </Content>
    </Wrapper>
  )
}

export default Footer
