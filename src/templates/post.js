import React, { useEffect } from 'react'
import { graphql, Link } from 'gatsby'
import mediumZoom from 'medium-zoom'
import {
  Wrapper,
  Content,
  BlogContent,
  Buttons,
} from '../components/general/Utils'

import SEO from './../components/general/SEO'
import Arrow from './../components/general/Arrow'
import Hero from './../components/general/Hero'

export function Zoom({ children }) {
  useEffect(() => mediumZoom('img', { margin: 64 }))
  return <>{children}</>
}

const BlogPost = ({ data, pageContext, location }) => {
  const post = data.contentfulPost
  const comments = `https://mobile.twitter.com/search?q=${encodeURIComponent(
    `https://iammatthias.com/blog/${post.slug}/`
  )}`
  const previous = pageContext.prev
  const next = pageContext.next

  return (
    <>
      <SEO
        title={post.title}
        image={post.heroImage}
        description={post.body.childMarkdownRemark.metaExcerpt}
      />
      <Wrapper>
        <Content>
          <section id="top">
            <h1>{post.title}</h1>
            <h5>
              Published: {post.publishDate} {'// '}
              Est. {post.body.childMarkdownRemark.timeToRead} minutes to read
            </h5>
            <Arrow anchor={location.pathname + '#bottom'} />
          </section>
        </Content>
        <BlogContent>
          <section id="bottom">
            <Hero image={post.heroImage} />
            <Zoom>
              <article
                className="article"
                id="zoom-container"
                dangerouslySetInnerHTML={{
                  __html: post.body.childMarkdownRemark.html,
                }}
              />
            </Zoom>
            <Buttons>
              {previous && (
                <Link className="button" to={`/blog/${previous.slug}/`}>
                  &#8592; Prev Post
                </Link>
              )}
              {next && (
                <Link className="button" to={`/blog/${next.slug}/`}>
                  Next Post &#8594;
                </Link>
              )}
              <a className="button" color="" href={comments}>
                Discuss on Twitter
              </a>
            </Buttons>
          </section>
        </BlogContent>
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
      metaDescription {
        internal {
          content
        }
      }
      publishDate(formatString: "DD MMM YYYY")
      publishDateISO: publishDate(formatString: "YYYY-MM-DD")
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
        childMarkdownRemark {
          html
          excerpt(pruneLength: 320)
          metaExcerpt: excerpt(pruneLength: 120)
          timeToRead
        }
      }
    }
  }
`

export default BlogPost
