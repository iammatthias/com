import React from 'react'
import { graphql } from 'gatsby'
import Helmet from 'react-helmet'
import config from '../utils/siteConfig'
import Layout from '../components/Layout'
import Hero from '../components/Hero'
import BlogList from '../components/Blog/BlogList'

import { Flex, Box } from 'rebass'

import SEO from '../components/SEO'

const Blog2 = ({ data, location }) => {
  const posts = data.allContentfulPost.edges
  const blog = data.contentfulBlog
  return (
    <Layout location={location}>
      <Helmet>
        <title>{`${config.siteTitle} - Blog`}</title>
      </Helmet>
      <SEO postNode={blog} pagePath="contact" customTitle pageSEO />
      <>
        <Flex flexWrap="wrap" className="changeDirection">
          <Box p={[3, 4]} width={[1, 1, 1 / 2]}>
            <Box p={[3, 4]} width={[1]}>
              <article
                dangerouslySetInnerHTML={{
                  __html: blog.body.childMarkdownRemark.html,
                }}
              />
            </Box>
            <Flex px={[3, 4]} width={[1]} flexWrap="wrap" flexDirection="row">
              {posts.map(({ node: post }) => (
                <BlogList
                  key={post.id}
                  slug={post.slug}
                  image={post.heroImage}
                  title={post.title}
                  date={post.publishDate}
                  time={post.body.childMarkdownRemark.timeToRead}
                  excerpt={post.body}
                />
              ))}
            </Flex>
          </Box>
          <Box p={0} width={[1, 1, 1 / 2]}>
            <Hero image={blog.heroImage} />
          </Box>
        </Flex>
      </>
    </Layout>
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
            fluid(maxWidth: 1000) {
              ...GatsbyContentfulFluid_withWebp
            }
          }
          body {
            childMarkdownRemark {
              html
              excerpt(pruneLength: 240)
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
        fluid(maxWidth: 1000) {
          ...GatsbyContentfulFluid_withWebp
        }
        ogimg: resize(width: 900) {
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

export default Blog2
