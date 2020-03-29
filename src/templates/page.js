/** @jsx jsx */

import React from 'react' //eslint-disable-line
import { jsx, ThemeProvider } from 'theme-ui'
import { graphql } from 'gatsby'
import Layout from '../components/Layout'
import Container from '../components/Container'
import SEO from '../components/SEO'
import MDXRenderer from 'gatsby-plugin-mdx/mdx-renderer'
import theme from 'gatsby-plugin-theme-ui'

import { MDXGlobalComponents } from '../components/MDX'

const PageTemplate = ({ data, location }) => {
  const { title, metaDescription, body } = data.contentfulPage
  return (
    <Layout
      title={title}
      blurb={metaDescription.internal.content}
      location={location.pathname}
    >
      <SEO
        title={title}
        description={
          metaDescription
            ? metaDescription.internal.content
            : body.childMarkdownRemark.excerpt
        }
      />
      <Container>
        <div
          sx={{
            maxWidth: theme => `${theme.sizes.maxWidth}`,
            margin: '0 auto',
          }}
        >
          <ThemeProvider theme={theme} components={MDXGlobalComponents}>
            <MDXRenderer>{body.childMdx.body}</MDXRenderer>
          </ThemeProvider>
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
