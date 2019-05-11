import React from 'react'
import { graphql } from 'gatsby'

import Hero from './../components/general/Hero'
import Blurb from './../components/general/Blurb'
import Form from './../components/general/contactForm'
import SEO from './../components/general/SEO'

import styled from 'styled-components'

import { Flex, Box } from 'rebass'

const Content = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  grid-template-areas: 'ContentCover' 'ContentStart';
  @media screen and (min-width: 52em) {
    grid-template-columns: 1fr 1fr;
    grid-template-areas: 'ContentStart ContentCover';
  }
  @media screen and (min-width: 64em) {
    grid-template-columns: 1fr 1fr 1fr;
    grid-template-areas: 'ContentStart ContentCover ContentCover';
  }
`
const ContentStart = styled.div`
  grid-area: ContentStart;
  display: grid;
  grid-template-areas: 'ContentCopy' 'ContentList';
  padding: 3.5rem;
`
const ContentCopy = styled(Blurb)`
  grid-area: ContentCopy;
`
const ContentList = styled.div`
  grid-area: ContentList;
`
const ContentCover = styled.div`
  grid-area: ContentCover;
`

const Contact = ({ data }) => {
  const contact = data.contentfulAbout
  return (
    <>
      <SEO title="CONTACT" image={contact.shareImage} />

      <Content>
        <ContentStart>
          <ContentCopy content={contact.body} />
          <Form />
        </ContentStart>
        <ContentCover>
          <Hero image={contact.heroImage} />
        </ContentCover>
      </Content>
    </>
  )
}

export const query = graphql`
  query {
    contentfulAbout {
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

export default Contact
