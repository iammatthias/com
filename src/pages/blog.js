import React from 'react'
import { graphql } from 'gatsby'
import styled from 'styled-components'
import ScrollableAnchor, { configureAnchors } from 'react-scrollable-anchor'
import List from './../components/general/contentList'
import SEO from './../components/general/SEO'
import Arrow from './../components/general/Arrow'

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
const BlogPosts = styled.div`
  display: flex;
  min-height: 100vh;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin: 2rem;
  section {
    display: grid;
    grid-template-columns: 1fr;
    grid-template-rows: 1fr;
    grid-gap: 1rem;
    width: 100%;
  }
  @media screen and (min-width: 52em) {
    margin: 1rem;
    section {
      display: grid;
      grid-template-columns: 1fr;
      grid-gap: 1rem;
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

const Blog = ({ data }) => {
  const posts = data.allContentfulPost.edges
  const blog = data.contentfulBlog
  return (
    <>
      <SEO image={blog.shareImage} />
      <Wrapper>
        <Content>
          <ScrollableAnchor id="content">
            <section>
              <h1>The blog</h1>
              <article
                dangerouslySetInnerHTML={{
                  __html: blog.body.childMarkdownRemark.html,
                }}
              />
            </section>
          </ScrollableAnchor>
          <Arrow anchor="#postList" />
        </Content>
        <BlogPosts>
          <ScrollableAnchor id="postList">
            <section>
              {posts.map(({ node: post }) => (
                <List
                  blogList
                  key={post.id}
                  slug={post.slug}
                  image={post.heroImage}
                  title={post.title}
                  date={post.publishDate}
                  time={post.body.childMarkdownRemark.timeToRead}
                  excerpt={post.body}
                />
              ))}
            </section>
          </ScrollableAnchor>
        </BlogPosts>
      </Wrapper>
    </>
  )
}

export const query = graphql`
  query {
    allContentfulPost(
      limit: 1000
      sort: { fields: [publishDate], order: DESC }
    ) {
      edges {
        node {
          title
          id
          slug
          publishDate(formatString: "DD MMM YYYY")
          heroImage {
            title
            fluid(quality: 65) {
              ...GatsbyContentfulFluid_withWebp
            }
          }
          body {
            childMarkdownRemark {
              html
              excerpt(pruneLength: 140)
              timeToRead
            }
          }
        }
      }
    }
    contentfulBlog {
      title
      id
      heroImage {
        title
        fluid(maxWidth: 1600, quality: 50) {
          ...GatsbyContentfulFluid_withWebp
        }
      }
      shareImage {
        ogimg: resize(width: 1200, quality: 50) {
          src
          width
          height
        }
      }
      body {
        childMarkdownRemark {
          html
        }
      }
    }
  }
`

export default Blog
