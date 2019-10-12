import React from 'react'
import { graphql, Link } from 'gatsby'
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
    article {
      margin: 2rem 0;
    }
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

const BlogPost = ({ data, pageContext }) => {
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
          <ScrollableAnchor id="content">
            <section>
              <h1>{post.title}</h1>
              <h5>
                Published: {post.publishDate} {'// '}
                Est. {post.body.childMarkdownRemark.timeToRead} minutes to read
              </h5>
            </section>
          </ScrollableAnchor>
          <Arrow anchor="#post" />
        </Content>
        <BlogContent>
          <ScrollableAnchor id="post">
            <>
              <section>
                <Hero image={post.heroImage} />
                <article
                  dangerouslySetInnerHTML={{
                    __html: post.body.childMarkdownRemark.html,
                  }}
                />
              </section>
              <Buttons>
                {previous && (
                  <Link className="button" to={`/${previous.slug}/`}>
                    &#8592; Prev Post
                  </Link>
                )}
                {next && (
                  <Link className="button" to={`/${next.slug}/`}>
                    Next Post &#8594;
                  </Link>
                )}
                <a className="button" color="" href={comments}>
                  Discuss on Twitter
                </a>
              </Buttons>
            </>
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
  }
`

export default BlogPost
