import React from 'react'
import { graphql } from 'gatsby'
import styled from 'styled-components'
import ScrollableAnchor, { configureAnchors } from 'react-scrollable-anchor'
import List from './../components/general/contentList'
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
const Galleries = styled.div`
  display: flex;
  min-height: 100vh;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin: 2rem;
  section {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    grid-gap: 1rem;
    width: 100%;
  }
  @media screen and (min-width: 52em) {
    margin: 1rem;
    section {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      grid-gap: 1rem;
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

const Index = ({ data }) => {
  const home = data.contentfulHome

  const contentfulGalleries = data.allContentfulExtendedGallery.edges
  return (
    <>
      <SEO image={home.shareImage} />
      <Wrapper>
        <Content>
          <ScrollableAnchor id="content">
            <section>
              <h1>{home.headline}</h1>
              <article
                dangerouslySetInnerHTML={{
                  __html: home.body.childMarkdownRemark.html,
                }}
              />
            </section>
          </ScrollableAnchor>
          <Arrow anchor="#galleries" />
        </Content>
        <Galleries>
          <ScrollableAnchor id="galleries">
            <section>
              {contentfulGalleries.map(({ node: gallery }) => (
                <List
                  galleryList
                  key={gallery.id}
                  slug={gallery.slug}
                  image={gallery.heroImage}
                  title={gallery.title}
                  date={gallery.publishDate}
                  excerpt={gallery.body}
                />
              ))}
            </section>
          </ScrollableAnchor>
        </Galleries>
      </Wrapper>
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
            fluid(quality: 50) {
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
      headline
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

export default Index
