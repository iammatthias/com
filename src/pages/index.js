/** @jsx jsx */

import React from 'react' //eslint-disable-line
import { jsx, Styled } from 'theme-ui'
import { graphql, Link } from 'gatsby'
import styled from '@emotion/styled'
import Layout from '../components/Layout'
import Container from '../components/Container'
import CardList from '../components/CardList'
import Card from '../components/Card'

const ContentGrid = styled.div`
  width: 100%;
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: 1fr;
  grid-gap: 2em;
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
            <CardList location={location.pathname}>
              {photography.map(({ node: photoSet }) => (
                <Card
                  key={photoSet.id}
                  id={photoSet.id}
                  to={`/photography/${photoSet.slug}/`}
                  thumbnail={photoSet.heroImage.thumbnail}
                  title={photoSet.title}
                  info={'Updated: ' + photoSet.updatedAt}
                />
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
            </CardList>
          </div>
          <div>
            <Styled.h2 sx={{ margin: '1em 0' }}>Recent Posts</Styled.h2>

            <CardList location={location.pathname}>
              {posts.map(({ node: post }) => (
                <Card
                  key={post.id}
                  id={post.id}
                  to={`/blog/${post.slug}/`}
                  thumbnail={post.heroImage.thumbnail}
                  title={post.title}
                  info={
                    'Published: ' +
                    post.publishDate +
                    '\u00A0 \u00A0 \u00A0' +
                    post.body.childMarkdownRemark.timeToRead +
                    ' minute read'
                  }
                />
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
            </CardList>
          </div>
          <div>
            <Styled.h2 sx={{ margin: '1em 0' }}>Etcetera</Styled.h2>

            <CardList location={location.pathname}>
              {/* <Card
                to={`/resume/`}
                title="Resume"
                info="Interested in working together?"
              /> */}

              <Card
                to={`/etc/generative/`}
                title="Generative"
                info="Trying my hand at generative art, learning as I go."
              />
              <Card
                to={`/etc/time/`}
                title="Time"
                info="A real time local clock with a dynamic background gradient."
              />
              <Card
                to={`/resources/`}
                title="Resources"
                info="Tools and platforms that I've found useful."
              />
            </CardList>
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
