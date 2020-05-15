/** @jsx jsx */

import React from 'react' //eslint-disable-line
import { jsx } from 'theme-ui'
import { graphql } from 'gatsby'
import Layout from '../components/Layout'

import Container from '../components/Container'

import GalleryGrid from '../components/GalleryGrid'

import EmailCapture from '../components/MDX/EmailCapture'

const PhotoSetTemplate = ({ data, pageContext, location }) => {
  const {
    title,
    metaDescription,
    updatedAt,
    galleries,
  } = data.contentfulPhotography

  return (
    <Layout
      title={title}
      blurb={metaDescription.internal.content}
      description={metaDescription}
      date={updatedAt}
      location={location.pathname}
    >
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
        <EmailCapture title={title} />
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
      updatedAt(formatString: "MMMM DD, YYYY")
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
            fluid(maxWidth: 1000, quality: 70) {
              ...GatsbyContentfulFluid_withWebp
              src
              srcSet
              aspectRatio
            }
            thumbnail: fluid(maxWidth: 300, quality: 50) {
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
