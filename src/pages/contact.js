/** @jsx jsx */

import React from 'react' //eslint-disable-line

import { jsx } from 'theme-ui'
import Img from 'gatsby-image'
import { MDXProvider } from '@mdx-js/react'
import MDXRenderer from 'gatsby-plugin-mdx/mdx-renderer'

import SEO from '../components/SEO'

import Form from '../components/contactForm'

import { Wrapper, Content } from '../utils/Styled'
import { useSiteMetadata } from '../utils/Metadata'

const Contact = ({ props, data }) => {
  const { biography, metaImage, portrait } = useSiteMetadata()

  return (
    <>
      <SEO title="MATTHIAS" image={metaImage} />
      <Wrapper>
        <Content className="biography">
          <div className="copy">
            <MDXProvider>
              <MDXRenderer>{biography.childMdx.body}</MDXRenderer>
            </MDXProvider>
            <Form />
          </div>
          <div className="portrait">
            <Img fluid={portrait.fluid} />
          </div>
        </Content>
      </Wrapper>
    </>
  )
}

export default Contact
