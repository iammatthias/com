import React from 'react'
import { graphql } from 'gatsby'
import styled from 'styled-components'

import Hero from './../components/general/Hero'
import Form from './../components/general/contactForm'
import SEO from './../components/general/SEO'
import Arrow from './../components/general/Arrow'

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
  section {
    width: 100%;
    padding: 2rem;
  }
  @media screen and (min-width: 52em) {
    height: calc(100vh - 7rem);

    section {
      width: 76.4%;
    }
  }
  @media screen and (min-width: 64em) {
    height: calc(100vh);

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
  section {
    padding: 2rem;
  }
  @media screen and (min-width: 52em) {
    section {
      width: 61.8%;
    }
  }
  @media screen and (min-width: 64em) {
    section {
      width: 61.8%;
    }
  }
`

const Contact = ({ data, location }) => {
  const contact = data.contentfulAbout
  return (
    <>
      <SEO title="CONTACT" image={contact.shareImage} />
      <Wrapper>
        <Content>
          <section id="top">
            <Hero image={contact.heroImage} />
          </section>

          <Arrow anchor={location.pathname + '#bottom'} />
        </Content>
        <About>
          <section id="bottom">
            <article
              dangerouslySetInnerHTML={{
                __html: contact.body.childMarkdownRemark.html,
              }}
            />

            <Form />
          </section>
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
