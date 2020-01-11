/** @jsx jsx */

import React, { useEffect } from 'react' //eslint-disable-line

import { jsx } from 'theme-ui'
import { graphql } from 'gatsby'

import SEO from '../components/SEO'

import { Wrapper, Content } from '../utils/Styled'
import { useSiteMetadata } from '../utils/Metadata'

import GalleryGrid from '../components/galleryGrid'

const Gallery = ({ data }) => {
  const { metaImage } = useSiteMetadata()
  const contentfulGallery = data.contentfulExtendedGallery
  const contentfulSubGalleries = data.contentfulExtendedGallery.galleries

  return (
    <>
      <SEO image={metaImage} />
      <Wrapper>
        <Content className="gallery">
          {contentfulSubGalleries.map((subGallery, index) => (
            <div
              key={index}
              css={{
                width: '100%',
              }}
            >
              {subGallery.__typename === 'ContentfulSubGallery' && (
                <GalleryGrid
                  key={subGallery.id}
                  slug={subGallery.slug}
                  images={subGallery.images}
                  title={subGallery.title}
                  itemsPerRow={[2, 2, 3, 5]}
                  parent={contentfulGallery.title}
                />
              )}
            </div>
          ))}
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

export default Gallery
