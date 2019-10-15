import React from 'react'
import { graphql, Link } from 'gatsby'
import styled from 'styled-components'

import SEO from './../components/general/SEO'
import Arrow from './../components/general/Arrow'
import Hero from './../components/general/Hero'

const Wrapper = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: 1fr;
  grid-template-areas: 'Content';
  max-width: 100%;
`
const Content = styled.div`
  grid-area: Content;
  display: flex;
  height: calc(100vh - 9rem);
  flex-direction: column;
  align-items: center;
  justify-content: center;
  section {
    padding: 2rem;
  }
  @media screen and (min-width: 52em) {
    height: calc(100vh - 7rem);

    section {
      width: 76.4%;
    }
  }
  @media screen and (min-width: 64em) {
    height: calc(100vh);

    section {
      width: 61.8%;
    }
  }
`
const BlogContent = styled.div`
  display: flex;
  min-height: 100vh;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  section {
    width: 100%;
    padding: 2rem;
    article {
      margin: 2rem 0;
    }
  }
  @media screen and (min-width: 52em) {
    section {
      width: 76.4%;
    }
  }
  @media screen and (min-width: 64em) {
    section {
      width: 61.8%;
    }
  }
`

const Buttons = styled.div`
  margin-bottom: 5rem;
  .button {
    display: block;
    margin: 0 0 1rem;
  }
  @media screen and (min-width: 52em) {
    .button {
      display: inline;
      margin: 0 1rem 0 0;
    }
  }
`

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
          </section>

          <Arrow anchor={location.pathname + '#bottom'} />
        </Content>
        <BlogContent>
          <section id="bottom">
            <Hero image={post.heroImage} />
            <article
              dangerouslySetInnerHTML={{
                __html: post.body.childMarkdownRemark.html,
              }}
            />
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
