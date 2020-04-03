import React from 'react'
import Helmet from 'react-helmet'
import { useStaticQuery, graphql } from 'gatsby'

const SEO = ({ title, description }) => {
  const { site, allSitePage } = useStaticQuery(
    graphql`
      query {
        site {
          siteMetadata {
            title
            description
            siteUrl
          }
        }
        allSitePage(filter: { component: { regex: "/^((?!tag|404).)*$/" } }) {
          edges {
            node {
              id
              context {
                title
                slug
              }
            }
          }
        }
      }
    `
  )

  const shareImage = allSitePage.ogFileName
  const metaDescription = description || site.siteMetadata.description

  console.log({ shareImage })

  return (
    <Helmet
      htmlAttributes={{
        lang: `en`,
      }}
      title={title}
      defaultTitle={site.siteMetadata.title}
      titleTemplate={`%s`}
    >
      <meta charSet="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      {/* General tags */}

      <meta name="description" content={metaDescription} />

      {/* OpenGraph tags */}
      <meta property="og:title" content={title} />

      <meta property="og:description" content={metaDescription} />

      {/* Twitter Card tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />

      <meta name="twitter:description" content={metaDescription} />
    </Helmet>
  )
}

export default SEO
