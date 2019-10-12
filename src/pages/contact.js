import React from 'react'
import { graphql } from 'gatsby'
import styled from 'styled-components'
import ScrollableAnchor, { configureAnchors } from 'react-scrollable-anchor'
import Hero from './../components/general/Hero'
import Form from './../components/general/contactForm'
import SEO from './../components/general/SEO'
import Arrow from './../components/general/Arrow'

configureAnchors({
  offset: -32,
  scrollDuration: 1000,
})

const Wrapper = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: 1fr;
  grid-template-areas: 'Content';
  max-width: 100%;
`
const Content = styled.div`
  grid-area: Content;
  display: flex;
  height: calc(100vh - 9rem);
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin: 2rem;
  div {
  }

  @media screen and (min-width: 52em) {
    height: calc(100vh - 7rem);
    margin: 1rem;
    section {
      width: 76.4%;
    }
  }
  @media screen and (min-width: 64em) {
    height: calc(100vh);
    margin: 0;
    section {
      width: 61.8%;
    }
  }
`
const About = styled.div`
  display: flex;
  min-height: 100vh;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin: 2rem;
  section {
    width: 100%;
  }
  @media screen and (min-width: 52em) {
    margin: 1rem;
    section {
      width: 61.8%;
    }
  }
  @media screen and (min-width: 64em) {
    margin: 0;
    section {
      width: 61.8%;
    }
  }
`

const Contact = ({ data }) => {
  const contact = data.contentfulAbout
  return (
    <>
      <SEO title="CONTACT" image={contact.shareImage} />
      <Wrapper>
        <Content>
          <ScrollableAnchor id="top">
            <section>
              <Hero image={contact.heroImage} />
            </section>
          </ScrollableAnchor>
          <Arrow anchor="#bottom" />
        </Content>
        <About>
          <ScrollableAnchor id="bottom">
            <section>
              <article
                dangerouslySetInnerHTML={{
                  __html: contact.body.childMarkdownRemark.html,
                }}
              />

              <Form />
            </section>
          </ScrollableAnchor>
        </About>
      </Wrapper>
    </>
  )
}

export const query = graphql`
  query {
    contentfulAbout {
      title
      headline
      id
      heroImage {
        title
        fluid(maxWidth: 1600, quality: 50) {
          ...GatsbyContentfulFluid_withWebp
        }
      }
      shareImage {
        ogimg: resize(width: 1200, quality: 50) {
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
