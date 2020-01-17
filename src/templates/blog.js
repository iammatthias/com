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

import Pagination from '../components/Pagination'

const Blog = ({ data, pageContext }) => {
  const { blog, metaImage } = useSiteMetadata()
  const contentfulPosts = data.allContentfulPost.edges

  const { currentPage } = pageContext

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
      <SEO title={'BLOG Pg. ' + currentPage} image={metaImage} />
      <Wrapper>
        <Content className="blogIntroduction">
          <MDXProvider>
            <MDXRenderer>{blog.childMdx.body}</MDXRenderer>
          </MDXProvider>
        </Content>

        <>
          {contentfulPosts.map(({ node: post }) => (
            <Content className="blog" key={post.id}>
              <Img
                className="hero"
                fluid={{ ...post.heroImage.fluid, aspectRatio: 4 / 3 }}
              />
              <article>
                <ContentLink to={`/blog/${post.slug}`}>
                  <p
                    sx={{
                      variant: 'styles.h1',
                    }}
                  >
                    {post.title}
                  </p>
                  <p
                    sx={{
                      variant: 'styles.h4',
                      borderLeft: '4px solid currentColor',
                      pl: 3,
                    }}
                  >
                    Published: {post.publishDate}&nbsp;&nbsp;&nbsp;{'//'}
                    &nbsp;&nbsp;&nbsp;
                    {post.body.childMdx.timeToRead} min read
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
              </article>
            </Content>
          ))}
        </>
        <Content className="pagination">
          <Pagination context={pageContext} />
        </Content>
      </Wrapper>
    </>
  )
}

export const query = graphql`
  query($skip: Int!, $limit: Int!) {
    allContentfulPost(
      sort: { fields: [publishDate], order: DESC }
      limit: $limit
      skip: $skip
    ) {
      edges {
        node {
          title
          id
          slug
          publishDate(formatString: "dddd, MMMM D, YYYY")
          heroImage {
            id
            title
            fluid(quality: 65) {
              ...GatsbyContentfulFluid_withWebp
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
    }
  }
`

export default Blog
