/** @jsx jsx */

import React from 'react' //eslint-disable-line
import { jsx } from 'theme-ui'
import { graphql } from 'gatsby'
import Layout from '../components/Layout'
import Hero from '../components/Hero'
import Container from '../components/Container'
import PostLinks from '../components/PostLinks'

import MDXRenderer from 'gatsby-plugin-mdx/mdx-renderer'

const PostTemplate = ({ data, pageContext, location }) => {
  const {
    title,
    metaDescription,
    heroImage,
    body,
    updatedAt,
    tags,
    slug,
  } = data.contentfulPost

  const previous = pageContext.prev
  const next = pageContext.next
  const { basePath } = pageContext

  const comments = `https://mobile.twitter.com/search?q=${encodeURIComponent(
    `https://iammatthias.com/blog/${slug}/`
  )}`

  return (
    <Layout
      title={title}
      blurb={metaDescription.internal.content}
      date={updatedAt}
      timeToRead={body.childMarkdownRemark.timeToRead}
      tags={tags}
      basePath={basePath}
      location={location.pathname}
      description={
        metaDescription
          ? metaDescription.internal.content
          : body.childMarkdownRemark.excerpt
      }
    >
      <Container
        sx={{
          display: 'grid',
          gridGap: '1em',
          gridTemplateColumns:
            'minmax(1rem, 1fr) minmax(1rem, 1fr) minmax(auto, 100ch) minmax(1rem, 1fr) minmax(1rem, 1fr)',
          '& > *': {
            gridColumn: ['1 / 6', '3'],
          },
          '& > .hero': {
            gridColumn: '1 / 6',
          },
        }}
      >
        <Hero title={title} image={heroImage} height={'61.8vh'} />

        <MDXRenderer>{body.childMdx.body}</MDXRenderer>

        <PostLinks
          previous={previous}
          next={next}
          basePath={basePath}
          comments={comments}
        />
      </Container>
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
      updatedAt(formatString: "MMMM DD, YYYY")
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
