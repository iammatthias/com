/** @jsx jsx */

import React, { useEffect } from 'react' //eslint-disable-line

import { jsx } from 'theme-ui'
import { graphql } from 'gatsby'
import Img from 'gatsby-image'
import { MDXProvider } from '@mdx-js/react'
import MDXRenderer from 'gatsby-plugin-mdx/mdx-renderer'

import mediumZoom from 'medium-zoom'

import SEO from '../components/SEO'

import { Wrapper, Content, ContentLink } from '../utils/Styled'
import { useSiteMetadata } from '../utils/Metadata'

const Blog = ({ props, data }) => {
  const { blog, metaImage } = useSiteMetadata()
  const contentfulPosts = data.allContentfulPost.edges

  const comments = `https://mobile.twitter.com/search?q=${encodeURIComponent(
    `https://iammatthias.com/blog/${contentfulPosts.slug}/`
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
      <SEO image={metaImage} />
      <Wrapper>
        <Content className="introduction">
          <MDXProvider>
            <MDXRenderer>{blog.childMdx.body}</MDXRenderer>
          </MDXProvider>
        </Content>
        <Content className="blog">
          {contentfulPosts.map(({ node: post }) => (
            <>
              <Img
                key={post.heroImage.id}
                className="hero"
                fluid={{ ...post.heroImage.fluid, aspectRatio: 4 / 3 }}
              />
              <article key={post.id}>
                <ContentLink to={`/blog/${post.slug}`}>
                  <p
                    sx={{
                      variant: 'styles.h1',
                    }}
                  >
                    {post.title}
                  </p>
                </ContentLink>
                <MDXProvider>
                  <MDXRenderer>{post.body.childMdx.body}</MDXRenderer>
                </MDXProvider>
                <div className="buttons">
                  <a
                    sx={{
                      variant: 'styles.a',
                    }}
                    href={comments}
                  >
                    Discuss on Twitter
                  </a>
                </div>
                <hr />
              </article>
            </>
          ))}
        </Content>
      </Wrapper>
    </>
  )
}

export const query = graphql`
  query Blog {
    allContentfulPost(
      limit: 1000
      sort: { fields: [publishDate], order: DESC }
    ) {
      edges {
        node {
          title
          id
          slug
          publishDate(formatString: "d/M/YYYY")
          heroImage {
            id
            title
            fluid(quality: 65) {
              ...GatsbyContentfulFluid_withWebp
            }
          }
          body {
            childMdx {
              body
              id
            }
          }
        }
      }
    }
  }
`

export default Blog
