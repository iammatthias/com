import React from 'react'
import { graphql } from 'gatsby'
import Layout from './../components/general/Layout'
import Hero from './../components/general/Hero'
import Form from './../components/contact/contactForm'
import SEO from './../components/general/SEO'

import { Flex, Box } from 'rebass'

const Contact = ({ data }) => {
  const contact = data.contentfulAbout
  return (
    <Layout>
      <SEO title="CONTACT" image={contact.shareImage} />

      <Flex flexWrap="wrap" mb={[5, 0]} className="changeDirection">
        <Box p={[3, 4]} width={[1, 1, 1 / 2, 1 / 3]}>
          <Box p={[3, 4]} width={[1]}>
            <article
              dangerouslySetInnerHTML={{
                __html: contact.body.childMarkdownRemark.html,
              }}
            />
          </Box>
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
    </Layout>
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
