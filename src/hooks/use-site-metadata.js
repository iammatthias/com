import { useStaticQuery, graphql } from 'gatsby'

export const useSiteMetadata = () => {
  const meta = useStaticQuery(
    graphql`
      query metaData {
        site {
          siteMetadata {
            siteUrl
          }
        }
        contentfulMeta {
          title
          subTitle
          introContent {
            childMdx {
              body
            }
          }
          footer {
            childMdx {
              body
            }
          }
          links {
            links {
              name
              slug
            }
          }
          siteDescription {
            internal {
              content
            }
          }
        }
      }
    `
  )
  return meta
}
