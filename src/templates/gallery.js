import React from 'react'
import { graphql } from 'gatsby'
import styled from 'styled-components'

import GalleryGrid from './../components/gallery/galleryGrid'
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
    padding: 2rem;
  }
  @media screen and (min-width: 52em) {
    height: calc(100vh);

    section {
      width: 76.4%;
    }
  }
  @media screen and (min-width: 64em) {
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
  section {
    width: 100%;
    padding: 2rem;
    article {
      margin: 2rem 0;
    }
  }
  @media screen and (min-width: 52em) {
    section {
      width: 76.4%;
    }
  }
  @media screen and (min-width: 64em) {
    section {
      width: 61.8%;
    }
  }
`

const GalleryTemplate = ({ data, location }) => {
  const gallery = data.contentfulExtendedGallery
  const subGalleries = data.contentfulExtendedGallery.galleries

  return (
    <>
      <SEO
        title={gallery.title}
        image={gallery.shareImage}
        description={gallery.body.childMarkdownRemark.metaExcerpt}
      />
      <Wrapper>
        <Content>
          <section id="top">
            <h1>{gallery.title}</h1>
            <article
              dangerouslySetInnerHTML={{
                __html: gallery.body.childMarkdownRemark.html,
              }}
            />
          </section>

          <Arrow anchor={location.pathname + '#bottom'} />
        </Content>
        <Galleries>
          <section id="bottom">
            {subGalleries.map((subGallery, index) => (
              <div key={index}>
                {subGallery.__typename === 'ContentfulSubGallery' && (
                  <GalleryGrid
                    key={subGallery.id}
                    slug={subGallery.slug}
                    images={subGallery.images}
                    title={subGallery.title}
                    itemsPerRow={[2, 2, 3, 5]}
                  />
                )}
              </div>
            ))}
          </section>
        </Galleries>
      </Wrapper>
    </>
  )
}

export const query = graphql`
  query($slug: String!) {
    contentfulExtendedGallery(slug: { eq: $slug }) {
      title
      id
      slug
      metaDescription {
        internal {
          content
        }
      }
      publishDate(formatString: "MMMM DD, YYYY")
      publishDateISO: publishDate(formatString: "YYYY-MM-DD")
      tags {
        title
        id
        slug
      }
      shareImage {
        ogimg: resize(width: 1200) {
          src
          width
          height
        }
      }
      body {
        childMarkdownRemark {
          html
          metaExcerpt: excerpt
        }
      }
      galleries {
        __typename
        ... on ContentfulSubGallery {
          id
          slug
          title
          images {
            id
            title
            fluid(maxWidth: 1600, quality: 50) {
              ...GatsbyContentfulFluid_withWebp
              src
              srcSet
              aspectRatio
            }
            thumbnail: fluid(maxWidth: 500, quality: 20) {
              ...GatsbyContentfulFluid_withWebp
              src
              aspectRatio
            }
          }
        }
      }
    }
  }
`
export default GalleryTemplate
