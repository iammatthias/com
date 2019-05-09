import React from 'react'
import { graphql } from 'gatsby'

import Hero from './../components/general/Hero'
import Blurb from './../components/general/Blurb'
import Form from './../components/general/contactForm'
import SEO from './../components/general/SEO'

import { Flex, Box } from 'rebass'

const Contact = ({ data, location }) => {
  const contact = data.contentfulAbout
  return (
    <div location={location}>
      <SEO title="CONTACT" image={contact.shareImage} />

      <Flex flexWrap="wrap" mb={[5, 0]} className="changeDirection">
        <Box p={[3, 4]} width={[1, 1, 1 / 2, 1 / 3]}>
          <Blurb content={contact.body} />
          <Flex
            px={[3, 4]}
            pb={[3, 4]}
            width={[1]}
            flexWrap="wrap"
            flexDirection="row"
          >
            <Form />
          </Flex>
        </Box>
        <Box p={0} width={[1, 1, 1 / 2, 2 / 3]}>
          <Hero image={contact.heroImage} />
        </Box>
      </Flex>
    </div>
  )
}

export const query = graphql`
  query {
    contentfulAbout {
      title
      id
      heroImage {
        title
        fluid(maxWidth: 1000, quality: 65) {
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

export default Contact
