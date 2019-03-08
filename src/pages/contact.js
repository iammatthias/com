import React from 'react'
import { graphql } from 'gatsby'
import Layout from '../components/Layout'
import Hero from '../components/Hero'
import ContactForm from '../components/Contact/ContactForm'
import SEO from '../components/SEO'

import { Flex, Box } from 'rebass'

const Contact = ({ data, location }) => {
  const contact = data.contentfulAbout
  return (
    <Layout location={location}>
      <SEO postNode={contact} pagePath="contact" customTitle pageSEO />
      <>
        <Flex flexWrap="wrap" mb={[5, 0]} className="changeDirection">
          <Box p={[3, 4]} width={[1, 1, 1 / 2, 1 / 3]}>
            <Box p={[3, 4]} width={[1]}>
              <article
                dangerouslySetInnerHTML={{
                  __html: contact.body.childMarkdownRemark.html,
                }}
              />
            </Box>
            <Flex px={[3, 4]} pb={[3, 4]} width={[1]} flexWrap="wrap" flexDirection="row">
              <ContactForm />
            </Flex>
          </Box>
          <Box p={0} width={[1, 1, 1 / 2, 2 / 3]}>
            <Hero image={contact.heroImage} />
          </Box>
        </Flex>
      </>
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

export default Contact
