import React from 'react'
import { graphql } from 'gatsby'

import GalleryGrid from './../components/gallery/galleryGrid'
import ContentHead from './../components/general/contentHead'
import SEO from './../components/general/SEO'

const GalleryTemplate = ({ data }) => {
  const gallery = data.contentfulExtendedGallery
  const subGalleries = data.contentfulExtendedGallery.galleries
  return (
    <>
      <SEO title={gallery.title} image={gallery.shareImage} />
      <ContentHead
        displayExcerpt
        title={gallery.title}
        body={gallery.body}
        tags={gallery.tags}
      />
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
              aspectRatio
            }
            thumbnail: fluid(maxWidth: 300, quality: 20) {
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
