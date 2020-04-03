/** @jsx jsx */

import React from 'react' //eslint-disable-line
import { jsx } from 'theme-ui'
import { graphql } from 'gatsby'
import Layout from '../components/Layout'

import Container from '../components/Container'

import GalleryGrid from '../components/GalleryGrid'

import SEO from '../components/SEO'

const PhotoSetTemplate = ({ data, pageContext, location }) => {
  const {
    title,
    metaDescription,
    publishDate,
    galleries,
  } = data.contentfulPhotography

  return (
    <Layout
      title={title}
      blurb={metaDescription.internal.content}
      date={publishDate}
      location={location.pathname}
    >
      <SEO title={title} description={metaDescription} />

      <Container>
        {galleries.map((gallery, index) => (
          <div
            className="subGallery"
            key={index}
            sx={{
              margin: '0 auto 5rem',
            }}
          >
            {gallery.__typename === 'ContentfulGallery' && (
              <GalleryGrid
                key={gallery.id}
                slug={gallery.slug}
                images={gallery.images}
                title={gallery.title}
                itemsPerRow={[2, 3, 4]}
                parent={title}
              />
            )}
          </div>
        ))}
      </Container>
    </Layout>
  )
}

export const query = graphql`
  query($slug: String!) {
    contentfulPhotography(slug: { eq: $slug }) {
      title
      slug
      metaDescription {
        internal {
          content
        }
      }
      publishDate(formatString: "MMMM DD, YYYY")
      publishDateISO: publishDate(formatString: "YYYY-MM-DD")

      heroImage {
        title
        fluid(maxWidth: 1800) {
          ...GatsbyContentfulFluid_noBase64
        }
        ogimg: resize(width: 1800) {
          src
        }
      }
      galleries {
        __typename
        ... on ContentfulGallery {
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
            thumbnail: fluid(maxWidth: 900, quality: 50) {
              ...GatsbyContentfulFluid_withWebp
              src
              srcSet
              aspectRatio
            }
          }
        }
      }
    }
  }
`

export default PhotoSetTemplate
