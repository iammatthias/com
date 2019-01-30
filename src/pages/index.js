import React from 'react'
import { graphql } from 'gatsby'
import Layout from '../components/Layout'
import Hero from '../components/Hero'
import HomeList from '../components/Home/HomeList'
import Logo from '../components/Logo'

import { Flex, Box, Text } from 'rebass'

import SEO from '../components/SEO'

const Index = ({ data, location }) => {
  const home = data.contentfulHome
  const galleries = data.allContentfulExtendedGallery.edges
  return (
    <Layout location={location}>
      <SEO />
      <>
        <Flex flexWrap="wrap" className="changeDirection">
          <Box p={[3, 4]} width={[1, 1, 1 / 2]}>
            <Logo />
            <Box p={[3, 4]} width={[1]}>
              <Text
                dangerouslySetInnerHTML={{
                  __html: home.body.childMarkdownRemark.html,
                }}
              />
            </Box>
            <Flex
              px={[3, 4]}
              width={[1]}
              flexWrap="wrap"
              flexDirection="column"
            >
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
          <Box p={0} width={[1, 1, 1 / 2]}>
            <Hero image={home.heroImage} />
          </Box>
        </Flex>
      </>
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
