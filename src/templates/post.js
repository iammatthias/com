import React from 'react'
import { Link, graphql } from 'gatsby'
import styled from 'styled-components'
import ScrollableAnchor, { configureAnchors } from 'react-scrollable-anchor'
import SEO from './../components/general/SEO'
import Arrow from './../components/general/Arrow'
import Hero from './../components/general/Hero'

configureAnchors({
  offset: -32,
  scrollDuration: 1000,
})

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
  margin: 2rem;
  @media screen and (min-width: 52em) {
    height: calc(100vh - 7rem);
    margin: 1rem;
    section {
      width: 76.4%;
    }
  }
  @media screen and (min-width: 64em) {
    height: calc(100vh);
    margin: 0;
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
  margin: 2rem;
  section {
    width: 100%;
  }
  @media screen and (min-width: 52em) {
    margin: 1rem;
    section {
      width: 61.8%;
    }
  }
  @media screen and (min-width: 64em) {
    margin: 0;
    section {
      width: 61.8%;
    }
  }
`

const Buttons = styled.div`
  grid-column: 3;
  margin-bottom: 5rem;
  @media screen and (min-width: 52em) {
    margin-bottom: 2rem;
  }
`

const BlogPost = ({ data }) => {
  const post = data.contentfulPost
  const discussUrl = `https://mobile.twitter.com/search?q=${encodeURIComponent(
    `https://iammatthias.com/blog/${post.slug}/`
  )}`
  const postIndex = find(
    data.allContentfulPost.edges,
    ({ node: post }) => post.id
  )
  return (
    <>
      <SEO
        title={post.title}
        image={post.heroImage}
        description={post.body.childMarkdownRemark.metaExcerpt}
      />
      <Wrapper>
        <Content>
          <ScrollableAnchor id="content">
            <section>
              <h1>{post.title}</h1>
              <h5>
                Published: {post.publishDate} {'// '}
                Est. {post.body.childMarkdownRemark.timeToRead} minutes to read
              </h5>
            </section>
          </ScrollableAnchor>
          <Arrow anchor="#blogPost" />
        </Content>
        <BlogContent>
          <ScrollableAnchor id="blogPost">
            <section>
              <Hero image={post.heroImage} />
              <article
                dangerouslySetInnerHTML={{
                  __html: post.body.childMarkdownRemark.html,
                }}
              />

              <Buttons className="article buttonColumn">
                {postIndex && (
                  <Link
                    className="button"
                    to={`/blog/${postIndex.previous.slug}/`}
                  >
                    Prev Post
                  </Link>
                )}
                {postIndex && (
                  <Link className="button" to={`/blog/${postIndex.next.slug}/`}>
                    Next Post
                  </Link>
                )}
                <a className="button" color="" href={discussUrl}>
                  Discuss on Twitter
                </a>
              </Buttons>
            </section>
          </ScrollableAnchor>
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
    allContentfulPost(
      limit: 1000
      sort: { fields: [publishDate], order: DESC }
    ) {
      edges {
        node {
          id
        }
        previous {
          slug
        }
        next {
          slug
        }
      }
    }
  }
`

export default BlogPost
