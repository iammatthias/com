import React from 'react'
import { graphql } from 'gatsby'

import Hero from './../components/general/Hero'
import Blurb from './../components/general/Blurb'
import ContentList from './../components/general/contentList'

import { Flex, Box } from 'rebass'

import SEO from './../components/general/SEO'

const Index = ({ data }) => {
  const home = data.contentfulHome
  const galleries = data.allContentfulExtendedGallery.edges
  return (
    <>
      <SEO image={home.shareImage} />
      <Flex flexWrap="wrap" mb={[5, 0]} className="changeDirection">
        <Box p={[3, 4]} width={[1, 1, 1 / 2, 1 / 3]}>
          <Blurb content={home.body} />
          <Flex width={[1]} flexWrap="wrap" flexDirection="row">
            {galleries.map(({ node: gallery }) => (
              <ContentList
                galleryList
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
        <Box className="hide" p={0} width={[1, 1, 1 / 2, 2 / 3]}>
          <Hero image={home.heroImage} />
        </Box>
      </Flex>
    </>
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
            fluid(quality: 65) {
              ...GatsbyContentfulFluid_withWebp
            }
          }
          body {
            childMarkdownRemark {
              excerpt(pruneLength: 140, format: HTML)
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
        fluid(maxWidth: 1600, quality: 65) {
          ...GatsbyContentfulFluid_withWebp
        }
      }
      shareImage {
        ogimg: resize(width: 1200, quality: 65) {
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
