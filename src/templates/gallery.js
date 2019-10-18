import React from 'react'
import { graphql } from 'gatsby'
import { Wrapper, Content, ExtendedGallery } from '../components/general/Utils'

import GalleryGrid from './../components/general/galleryGrid'
import SEO from './../components/general/SEO'
import Arrow from './../components/general/Arrow'

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
            <Arrow anchor={location.pathname + '#bottom'} />
          </section>
        </Content>
        <ExtendedGallery>
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
                    parent={gallery.title}
                  />
                )}
              </div>
            ))}
          </section>
        </ExtendedGallery>
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
