/** @jsx jsx */

import React from 'react' //eslint-disable-line
import { jsx, ThemeProvider } from 'theme-ui'
import { graphql } from 'gatsby'
import Layout from '../components/Layout'
import Hero from '../components/Hero'
import Container from '../components/Container'
import PostLinks from '../components/PostLinks'

import SEO from '../components/SEO'
import MDXRenderer from 'gatsby-plugin-mdx/mdx-renderer'
import theme from 'gatsby-plugin-theme-ui'

import { MDXGlobalComponents } from '../components/MDX'

const PostTemplate = ({ data, pageContext }) => {
  const {
    title,
    metaDescription,
    heroImage,
    body,
    publishDate,
    tags,
    slug,
  } = data.contentfulPost

  const previous = pageContext.prev
  const next = pageContext.next
  const { basePath } = pageContext

  const comments = `https://mobile.twitter.com/search?q=${encodeURIComponent(
    `https://iammatthias.com/blog/${slug}/`
  )}`

  let ogImage
  try {
    ogImage = heroImage.ogimg.src
  } catch (error) {
    ogImage = null
  }

  return (
    <Layout
      title={title}
      blurb={metaDescription.internal.content}
      date={publishDate}
      timeToRead={body.childMarkdownRemark.timeToRead}
      tags={tags}
      basePath={basePath}
    >
      <SEO
        title={title}
        description={
          metaDescription
            ? metaDescription.internal.content
            : body.childMarkdownRemark.excerpt
        }
        image={ogImage}
      />
      <Hero title={title} image={heroImage} height={'50vh'} />
      <Container>
        <div
          sx={{
            maxWidth: theme => `${theme.sizes.maxWidthCentered}`,
            margin: '0 auto',
          }}
        >
          <ThemeProvider theme={theme} components={MDXGlobalComponents}>
            <MDXRenderer>{body.childMdx.body}</MDXRenderer>
          </ThemeProvider>
        </div>
      </Container>
      <PostLinks
        previous={previous}
        next={next}
        basePath={basePath}
        comments={comments}
      />
    </Layout>
  )
}

export const query = graphql`
  query($slug: String!) {
    contentfulPost(slug: { eq: $slug }) {
      title
      slug
      metaDescription {
        internal {
          content
        }
      }
      publishDate(formatString: "MMMM DD, YYYY")
      publishDateISO: publishDate(formatString: "YYYY-MM-DD")
      tags {
        title
        id
        slug
      }
      heroImage {
        title
        fluid(maxWidth: 1800) {
          ...GatsbyContentfulFluid_noBase64
        }
        ogimg: resize(width: 1800) {
          src
        }
      }
      body {
        childMdx {
          timeToRead
          body
          id
        }
        childMarkdownRemark {
          timeToRead
          html
          excerpt(pruneLength: 320)
        }
      }
    }
  }
`

export default PostTemplate
