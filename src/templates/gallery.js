import React from 'react'
import { graphql } from 'gatsby'
import Layout from './../components/general/Layout'
import GalleryGrid from './../components/gallery/galleryGrid'
import GalleryHead from './../components/gallery/galleryHead'
import SEO from './../components/general/SEO'

const GalleryTemplate = ({ data, location }) => {
  const gallery = data.contentfulExtendedGallery
  const subGalleries = data.contentfulExtendedGallery.galleries
  return (
    <Layout location={location}>
      <SEO title={gallery.title} image={gallery.shareImage} />
      <GalleryHead
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
              itemsPerRow={[1, 2, 3, 4]}
            />
          )}
        </div>
      ))}
    </Layout>
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
            title
            fluid(maxWidth: 1000, quality: 65) {
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
