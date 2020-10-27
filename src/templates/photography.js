import React from 'react'
import { graphql } from 'gatsby'
import Layout from '../components/Layout'
import CardList from '../components/CardList'
import Card from '../components/Card'
import Container from '../components/Container'

const Posts = ({ data, pageContext, location }) => {
  const photoSets = data.allContentfulPhotography.edges

  const metaDescription = 'A camera and a dream.'

  return (
    <Layout
      title="Photography"
      blurb={metaDescription}
      description={metaDescription}
      location={location.pathname}
    >
      <Container>
        <CardList location={location.pathname}>
          {photoSets.map(({ node: gallery }) => (
            <Card
              key={gallery.id}
              id={gallery.id}
              to={`/photography/${gallery.slug}/`}
              heroImage={gallery.heroImage.fluid}
              title={gallery.title}
              date={'Published: ' + gallery.publishDate}
            />
          ))}
        </CardList>
      </Container>
    </Layout>
  )
}

export const query = graphql`
  query {
    allContentfulPhotography(sort: { fields: updatedAt, order: DESC }) {
      edges {
        node {
          title
          id
          slug
          publishDate(formatString: "MMMM DD, YYYY")
          updatedAt(formatString: "MMMM DD, YYYY")
          heroImage {
            title
            fluid(maxWidth: 1800) {
              ...GatsbyContentfulFluid_withWebp_noBase64
            }
            ogimg: resize(width: 1800) {
              src
            }
          }
        }
      }
    }
  }
`

export default Posts
