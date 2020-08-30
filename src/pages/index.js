/** @jsx jsx */

import React from 'react' //eslint-disable-line
import { jsx, Styled, Grid } from 'theme-ui'
import { graphql, Link } from 'gatsby'
import styled from '@emotion/styled'
import Layout from '../components/Layout'
import Container from '../components/Container'
import Img from 'gatsby-image'

import { Tooltip } from 'react-tippy'

const ContentGrid = styled.div`
  width: 100%;
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: 1fr;
  grid-gap: 1em;
  @media screen and (min-width: ${props => props.theme.responsive.small}) {
    grid-template-columns: 1fr 1fr;
    grid-template-rows: 1fr;
  }
  @media screen and (min-width: 1801px) {
    grid-template-columns: 1fr 1fr 1fr;
    grid-template-rows: 1fr;
  }
`

const Posts = ({ data, pageContext, location }) => {
  const photography = data.allContentfulPhotography.edges
  const posts = data.allContentfulPost.edges

  return (
    <Layout location={location.pathname}>
      <Container>
        <ContentGrid>
          <div>
            <Styled.h2 sx={{ margin: '1em 0' }}>Photography</Styled.h2>
            <Grid gap={3} rows={'auto'}>
              {photography.map(({ node: photoSet }) => (
                <Link
                  key={photoSet.id}
                  to={`/photography/${photoSet.slug}/`}
                  sx={{
                    color: 'text',
                    textDecoration: 'none',
                    border: '1px solid',
                    bordercolor: 'inherit',
                    padding: [2, 3],
                    borderRadius: '4px',
                  }}
                >
                  <Tooltip
                    // options
                    position="bottom"
                    followCursor="true"
                    html={
                      <div
                        style={{
                          width: '200px',
                          border: '1px solid',
                          bordercolor: 'inherit',
                          borderRadius: '4px',
                          overflow: 'hidden',
                        }}
                      >
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
                    <Styled.p sx={{ m: 0 }}>
                      Updated: {photoSet.updatedAt}
                    </Styled.p>
                  </Tooltip>
                </Link>
              ))}
              <Link
                to={`/photography/`}
                sx={{
                  color: 'text',
                  textDecoration: 'none',
                  py: [2, 3],
                }}
              >
                <Styled.p>View more...</Styled.p>
              </Link>
            </Grid>
          </div>
          <div>
            <Styled.h2 sx={{ margin: '1em 0' }}>Recent Posts</Styled.h2>

            <Grid gap={3} rows={'auto'}>
              {posts.map(({ node: post }) => (
                <Link
                  key={post.id}
                  to={`/blog/${post.slug}/`}
                  sx={{
                    color: 'text',
                    textDecoration: 'none',
                    border: '1px solid',
                    bordercolor: 'inherit',
                    padding: [2, 3],
                    borderRadius: '4px',
                  }}
                >
                  <Tooltip
                    // options
                    position="bottom"
                    followCursor="true"
                    html={
                      <div
                        style={{
                          width: '200px',
                          border: '1px solid',
                          bordercolor: 'inherit',
                          borderRadius: '4px',
                          overflow: 'hidden',
                        }}
                      >
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
                    <Styled.p sx={{ m: 0 }}>
                      Published: {post.publishDate} &nbsp;/&nbsp;/&nbsp;
                      {post.body.childMarkdownRemark.timeToRead} minute read
                    </Styled.p>
                  </Tooltip>
                </Link>
              ))}
              <Link
                to={`/blog/`}
                sx={{
                  color: 'text',
                  textDecoration: 'none',

                  py: [2, 3],
                }}
              >
                <Styled.p>View more...</Styled.p>
              </Link>
            </Grid>
          </div>
          <div>
            <Styled.h2 sx={{ margin: '1em 0' }}>Etcetera</Styled.h2>

            <Grid gap={3} rows={'auto'}>
              {/* <Link
              to={`/resume/`}
              sx={{
                color: 'text',
                textDecoration: 'none',
                border: '1px solid',
                bordercolor: 'inherit',
                padding: [2, 3],
              }}
            >
              <Styled.h4>Resume</Styled.h4>
              <Styled.p sx={{ m: 0 }}>Interested in working together?</Styled.p>
            </Link> */}
              <Link
                to={`/etc/generative/`}
                sx={{
                  color: 'text',
                  textDecoration: 'none',
                  border: '1px solid',
                  bordercolor: 'inherit',
                  padding: [2, 3],
                  borderRadius: '4px',
                }}
              >
                <Styled.h4>Generative</Styled.h4>
                <Styled.p sx={{ m: 0 }}>
                  Trying my hand at generative art, learning as I go.
                </Styled.p>
              </Link>
              <Link
                to={`/etc/time/`}
                sx={{
                  color: 'text',
                  textDecoration: 'none',
                  border: '1px solid',
                  bordercolor: 'inherit',
                  padding: [2, 3],
                  borderRadius: '4px',
                }}
              >
                <Styled.h4>Time</Styled.h4>
                <Styled.p sx={{ m: 0 }}>
                  A real time local clock with a dynamic background gradient.
                </Styled.p>
              </Link>
              <Link
                to={`/resources/`}
                sx={{
                  color: 'text',
                  textDecoration: 'none',
                  border: '1px solid',
                  bordercolor: 'inherit',
                  padding: [2, 3],
                  borderRadius: '4px',
                }}
              >
                <Styled.h4>Resources</Styled.h4>
                <Styled.p sx={{ m: 0 }}>
                  Tools and platforms that I've found useful.
                </Styled.p>
              </Link>
            </Grid>
          </div>
        </ContentGrid>
      </Container>
    </Layout>
  )
}

export const query = graphql`
  query {
    allContentfulPost(sort: { fields: publishDate, order: DESC }, limit: 4) {
      edges {
        node {
          title
          id
          slug
          publishDate(formatString: "MMMM DD, YYYY")
          updatedAt(formatString: "MMMM DD, YYYY")
          heroImage {
            thumbnail: fluid(maxWidth: 400, quality: 50) {
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
    allContentfulPhotography(
      sort: { fields: updatedAt, order: DESC }
      limit: 4
    ) {
      edges {
        node {
          title
          id
          slug
          publishDate(formatString: "MMMM DD, YYYY")
          updatedAt(formatString: "MMMM DD, YYYY")
          heroImage {
            thumbnail: fluid(maxWidth: 400, quality: 50) {
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
