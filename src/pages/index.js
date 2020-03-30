/** @jsx jsx */

import React from 'react' //eslint-disable-line
import { jsx, Styled } from 'theme-ui'
import { graphql, Link } from 'gatsby'
import styled from '@emotion/styled'
import Layout from '../components/Layout'
import Container from '../components/Container'
import Pagination from '../components/Pagination'
import SEO from '../components/SEO'
import { startCase } from 'lodash'
import Img from 'gatsby-image'

import { Tooltip } from 'react-tippy'

const ContentGrid = styled.div`
  width: 100%;
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: 1fr;
  grid-gap: 1em;
  @media screen and (min-width: ${props => props.theme.responsive.small}) {
    grid-template-columns: 6fr 3fr;
    grid-template-rows: 1fr;
  }
`

const List = styled.ul`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  margin: 2em auto;
  @media screen and (min-width: ${props => props.theme.responsive.small}) {
    margin: 0 auto;
  }
`

const Posts = ({ data, pageContext, location }) => {
  const photography = data.allContentfulPhotography.edges
  const posts = data.allContentfulPost.edges
  const { basePath } = pageContext

  let ogImage

  try {
    ogImage = posts[0].node.heroImage.ogimg.src
  } catch (error) {
    ogImage = null
  }

  return (
    <Layout location={location.pathname}>
      <SEO title={startCase(basePath)} image={ogImage} />

      <Container>
        <ContentGrid>
          <div>
            <Styled.h2 sx={{ margin: '1em 0' }}>Photography</Styled.h2>
            <List>
              {photography.map(({ node: photoSet }) => (
                <Link
                  key={photoSet.id}
                  to={`/photography/${photoSet.slug}/`}
                  sx={{ color: 'text', textDecoration: 'none' }}
                >
                  <Tooltip
                    // options
                    position="right-end"
                    followCursor="true"
                    html={
                      <div style={{ width: '200px' }}>
                        <Img
                          fluid={{
                            ...photoSet.heroImage.thumbnail,
                            aspectRatio: 4 / 3,
                          }}
                        />
                      </div>
                    }
                  >
                    <Styled.h4>{photoSet.title}</Styled.h4>
                    <Styled.p>Updated: {photoSet.updatedAt}</Styled.p>
                  </Tooltip>
                </Link>
              ))}
            </List>
          </div>
          <div>
            <Styled.h2 sx={{ margin: '1em 0' }}>Recent Posts</Styled.h2>
            <List>
              {posts.map(({ node: post }) => (
                <Link
                  key={post.id}
                  to={`/blog/${post.slug}/`}
                  sx={{ color: 'text', textDecoration: 'none' }}
                >
                  <Tooltip
                    // options
                    position="right-end"
                    followCursor="true"
                    html={
                      <div style={{ width: '150px' }}>
                        <Img
                          fluid={{
                            ...post.heroImage.thumbnail,
                            aspectRatio: 4 / 3,
                          }}
                        />
                      </div>
                    }
                  >
                    <Styled.h4>{post.title}</Styled.h4>
                    <Styled.p>
                      Published: {post.publishDate} &nbsp;/&nbsp;/&nbsp;
                      {post.body.childMarkdownRemark.timeToRead} minute read
                    </Styled.p>
                  </Tooltip>
                </Link>
              ))}
            </List>
          </div>
        </ContentGrid>
      </Container>
      <Pagination context={pageContext} />
    </Layout>
  )
}

export const query = graphql`
  query {
    allContentfulPost(sort: { fields: [publishDate], order: DESC }, limit: 6) {
      edges {
        node {
          title
          id
          slug
          publishDate(formatString: "MMMM DD, YYYY")
          heroImage {
            thumbnail: fluid(maxWidth: 900, quality: 50) {
              ...GatsbyContentfulFluid_withWebp
              src
              aspectRatio
            }
          }
          body {
            childMarkdownRemark {
              timeToRead
              html
              excerpt(pruneLength: 80)
            }
          }
        }
      }
    }
    allContentfulPhotography(sort: { fields: [updatedAt], order: DESC }) {
      edges {
        node {
          title
          id
          slug
          publishDate(formatString: "MMMM DD, YYYY")
          updatedAt(formatString: "MMMM DD, YYYY")
          heroImage {
            thumbnail: fluid(maxWidth: 900, quality: 50) {
              ...GatsbyContentfulFluid_withWebp
              src
              aspectRatio
            }
          }
        }
      }
    }
  }
`

export default Posts
