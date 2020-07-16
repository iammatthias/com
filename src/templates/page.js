/** @jsx jsx */

import React from 'react' //eslint-disable-line
import { jsx } from 'theme-ui'
import { graphql } from 'gatsby'
import Layout from '../components/Layout'
import Container from '../components/Container'

import MDXRenderer from 'gatsby-plugin-mdx/mdx-renderer'

const PageTemplate = ({ data, location }) => {
  const { title, metaDescription, body } = data.contentfulPage
  return (
    <Layout
      title={title}
      blurb={metaDescription.internal.content}
      location={location.pathname}
      description={
        metaDescription
          ? metaDescription.internal.content
          : body.childMarkdownRemark.excerpt
      }
      sx={{ mb: '64px' }}
    >
      <Container>
        <div
          sx={{
            maxWidth: theme => `${theme.sizes.maxWidth}`,
            margin: '0 auto',
          }}
        >
          <MDXRenderer>{body.childMdx.body}</MDXRenderer>
        </div>
      </Container>
    </Layout>
  )
}

export const query = graphql`
  query($slug: String!) {
    contentfulPage(slug: { eq: $slug }) {
      title
      slug
      metaDescription {
        internal {
          content
        }
      }
      body {
        childMdx {
          timeToRead
          body
          id
        }
        childMarkdownRemark {
          html
          excerpt(pruneLength: 320)
        }
      }
    }
  }
`

export default PageTemplate
