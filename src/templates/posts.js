import React from 'react'
import { graphql } from 'gatsby'
import Layout from '../components/Layout'
import CardList from '../components/CardList'
import Card from '../components/Card'
import Container from '../components/Container'
import Pagination from '../components/Pagination'
import SEO from '../components/SEO'

const Posts = ({ data, pageContext, location }) => {
  const posts = data.allContentfulPost.edges
  const { basePath } = pageContext

  let ogImage

  try {
    ogImage = posts[0].node.heroImage.ogimg.src
  } catch (error) {
    ogImage = null
  }

  const metaDescription =
    'Part journal, part project log, part a little bit of everything—touching on photography, art & design, building for the web (and for emails), and life itself.'

  return (
    <Layout title="Blog" blurb={metaDescription} location={location.pathname}>
      <SEO title="Blog" image={ogImage} />
      <Container>
        <CardList>
          {posts.map(({ node: post }) => (
            <Card key={post.id} {...post} basePath={basePath + 'blog'} />
          ))}
        </CardList>
      </Container>
      <Pagination context={pageContext} />
    </Layout>
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
          publishDate(formatString: "MMMM DD, YYYY")
          heroImage {
            title
            fluid(maxWidth: 1800) {
              ...GatsbyContentfulFluid_withWebp_noBase64
            }
            ogimg: resize(width: 1800) {
              src
            }
          }
          body {
            childMarkdownRemark {
              timeToRead
              html
              excerpt(pruneLength: 320)
            }
          }
        }
      }
    }
  }
`

export default Posts
