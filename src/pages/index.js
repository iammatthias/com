import React from 'react'
import { graphql } from 'gatsby'
import Layout from './../components/general/Layout'
import Hero from './../components/general/Hero'
import HomeList from './../components/home/homeList'

import { Flex, Box } from 'rebass'

import SEO from './../components/general/SEO'

const Index = ({ data, location }) => {
  const home = data.contentfulHome
  const galleries = data.allContentfulExtendedGallery.edges
  return (
    <Layout location={location}>
      <SEO />
      <Flex flexWrap="wrap" mb={[5, 0]} className="changeDirection">
        <Box p={[3, 4]} width={[1, 1, 1 / 2, 1 / 3]}>
          <Box p={[3, 4]} width={[1]}>
            <article
              dangerouslySetInnerHTML={{
                __html: home.body.childMarkdownRemark.html,
              }}
            />
          </Box>
          <Flex width={[1]} flexWrap="wrap" flexDirection="row">
            {galleries.map(({ node: gallery }) => (
              <HomeList
                key={gallery.id}
                slug={gallery.slug}
                image={gallery.heroImage}
                title={gallery.title}
                date={gallery.publishDate}
                excerpt={gallery.body}
              />
            ))}
          </Flex>
        </Box>
        <Box p={0} width={[1, 1, 1 / 2, 2 / 3]}>
          <Hero image={home.heroImage} />
        </Box>
      </Flex>
    </Layout>
  )
}

export const query = graphql`
  query Index {
    allContentfulExtendedGallery(
      limit: 1000
      sort: { fields: [publishDate], order: DESC }
    ) {
      edges {
        node {
          title
          id
          slug
          publishDate(formatString: "DD MMM YYYY h:mm a")
          heroImage {
            title
            fluid(maxWidth: 1000) {
              ...GatsbyContentfulFluid_withWebp
            }
          }
          body {
            childMarkdownRemark {
              excerpt(pruneLength: 140)
            }
          }
        }
      }
    }
    contentfulHome {
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

export default Index
