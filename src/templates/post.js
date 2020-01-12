/** @jsx jsx */

import React, { useEffect } from 'react' //eslint-disable-line

import { jsx } from 'theme-ui'
import { graphql, Link } from 'gatsby'
import Img from 'gatsby-image'
import { MDXProvider } from '@mdx-js/react'
import MDXRenderer from 'gatsby-plugin-mdx/mdx-renderer'

import mediumZoom from 'medium-zoom'

import SEO from '../components/SEO'

import { Wrapper, Content, ContentLink } from '../utils/Styled'

const BlogPost = ({ pageContext, data }) => {
  const contentfulPost = data.contentfulPost

  const previous = pageContext.prev
  const next = pageContext.next

  const comments = `https://mobile.twitter.com/search?q=${encodeURIComponent(
    `https://iammatthias.com/blog/${contentfulPost.slug}/`
  )}`

  useEffect(() => {
    ;(async function() {
      try {
        mediumZoom('figure img', { margin: 64 })
      } catch (e) {
        console.error(e)
      }
    })()
  })

  return (
    <>
      <SEO
        image={contentfulPost.heroImage}
        description={contentfulPost.metaDescription.internal.content}
      />
      <Wrapper>
        <Content className="blog">
          <article key={contentfulPost.id}>
            <ContentLink to={contentfulPost.slug}>
              <p
                sx={{
                  variant: 'styles.h1',
                }}
              >
                {contentfulPost.title}
              </p>
              <p
                sx={{
                  variant: 'styles.h4',
                  borderLeft: '4px solid currentColor',
                  pl: 3,
                }}
              >
                Published: {contentfulPost.publishDate}&nbsp;&nbsp;&nbsp;{'//'}
                &nbsp;&nbsp;&nbsp;
                {contentfulPost.body.childMdx.timeToRead} min read
              </p>
            </ContentLink>
            <MDXProvider>
              <MDXRenderer>{contentfulPost.body.childMdx.body}</MDXRenderer>
            </MDXProvider>
            <div className="buttons">
              {previous && (
                <>
                  <Link
                    sx={{
                      variant: 'styles.a',
                    }}
                    className="button"
                    to={`/blog/${previous.slug}/`}
                  >
                    &#8592; Prev Post
                  </Link>
                  &nbsp;&nbsp;&nbsp;
                </>
              )}

              {next && (
                <>
                  <Link
                    sx={{
                      variant: 'styles.a',
                    }}
                    className="button"
                    to={`/blog/${next.slug}/`}
                  >
                    Next Post &#8594;
                  </Link>
                  &nbsp;&nbsp;&nbsp;
                </>
              )}
              <a
                sx={{
                  variant: 'styles.a',
                }}
                href={comments}
              >
                Discuss on Twitter
              </a>
            </div>
          </article>
          <Img
            key={contentfulPost.heroImage.id}
            className="hero"
            fluid={{ ...contentfulPost.heroImage.fluid, aspectRatio: 4 / 3 }}
          />
        </Content>
      </Wrapper>
    </>
  )
}

export const query = graphql`
  query($slug: String!) {
    contentfulPost(slug: { eq: $slug }) {
      title
      id
      slug
      publishDate(formatString: "d/M/YYYY")
      metaDescription {
        internal {
          content
        }
      }
      tags {
        title
        id
        slug
      }
      heroImage {
        title
        fluid(maxWidth: 1600, quality: 50) {
          ...GatsbyContentfulFluid_withWebp
          src
        }
        ogimg: fluid(maxWidth: 900, quality: 50) {
          ...GatsbyContentfulFluid_withWebp
          src
        }
      }
      body {
        childMdx {
          timeToRead
          body
          id
        }
      }
    }
  }
`

export default BlogPost
