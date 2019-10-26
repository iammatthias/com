import React from 'react'
import { graphql } from 'gatsby'
import { Wrapper, Content, ContentBottom } from '../components/Utils'
import List from '../components/contentList'
import SEO from '../components/SEO'
import Arrow from '../components/Arrow'

const Blog = ({ data, location }) => {
  const posts = data.allContentfulPost.edges
  const blog = data.contentfulBlog
  return (
    <>
      <SEO image={blog.shareImage} />
      <Wrapper>
        <Content>
          <section id="top">
            <h1>{blog.title}</h1>
            <article
              dangerouslySetInnerHTML={{
                __html: blog.body.childMarkdownRemark.html,
              }}
            />
            <Arrow anchor={location.pathname + '#bottom'} />
          </section>
        </Content>
        <ContentBottom className="blogposts">
          <section id="bottom">
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
        </ContentBottom>
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
