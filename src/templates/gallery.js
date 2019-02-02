import React from 'react'
import { graphql } from 'gatsby'
import Helmet from 'react-helmet'
import config from '../utils/siteConfig'
import Layout from '../components/Layout'
import GalleryGrid from '../components/Gallery/GalleryGrid1'
import GalleryHead from '../components/Gallery/GalleryHead'
import SEO from '../components/SEO'

const GalleryTemplate = ({ data, location }) => {
  const gallery = data.contentfulExtendedGallery
  const subGalleries = data.contentfulExtendedGallery.galleries
  return (
    <Layout location={location}>
      <Helmet>
        <title>{`${config.siteTitle} - ${gallery.title} `}</title>
      </Helmet>
      <SEO pagePath={gallery.slug} postNode={gallery} gallerySEO />
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
      heroImage {
        title
        fluid(maxWidth: 1000) {
          ...GatsbyContentfulFluid_withWebp
        }
        ogimg: resize(width: 900) {
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
            fluid(maxWidth: 1200, quality: 80) {
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
