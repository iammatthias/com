/** @jsx jsx */

import React from 'react' //eslint-disable-line

import { jsx } from 'theme-ui'
import { graphql } from 'gatsby'

import SEO from '../components/SEO'
import GalleryGrid from '../components/galleryGrid'

import { Wrapper, Content } from '../utils/Styled'

const Gallery = ({ data, location }) => {
  const contentfulGallery = data.contentfulExtendedGallery
  const contentfulSubGalleries = data.contentfulExtendedGallery.galleries

  return (
    <>
      <SEO
        image={contentfulGallery.heroImage}
        title={'GALLERY.' + contentfulGallery.title}
        description={contentfulGallery.metaDescription.internal.content}
      />
      <Wrapper>
        <Content className="gallery">
          <p
            sx={{
              variant: 'styles.h1',
            }}
            key={contentfulGallery.title}
          >
            {contentfulGallery.title}
          </p>
          <>
            {contentfulSubGalleries.map((subGallery, index) => (
              <div className="subGallery" key={index}>
                {subGallery.__typename === 'ContentfulSubGallery' && (
                  <GalleryGrid
                    key={subGallery.id}
                    slug={subGallery.slug}
                    images={subGallery.images}
                    title={subGallery.title}
                    itemsPerRow={[3, 6, 8]}
                    parent={contentfulGallery.title}
                  />
                )}
              </div>
            ))}
          </>
        </Content>
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

      galleries {
        __typename
        ... on ContentfulSubGallery {
          id
          slug
          title
          images {
            id
            title
            fluid(maxWidth: 1200, quality: 60) {
              ...GatsbyContentfulFluid_withWebp
              src
              srcSet
              aspectRatio
            }
            thumbnail: fluid(maxWidth: 300, quality: 60) {
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

export default Gallery
