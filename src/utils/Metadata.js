import { useStaticQuery, graphql } from 'gatsby'
export const useSiteMetadata = () => {
  const { contentfulConfig } = useStaticQuery(
    graphql`
      query SiteMetaData {
        contentfulConfig {
          title
          id
          introduction {
            childMdx {
              body
              id
            }
          }
          portrait {
            title
            fluid(quality: 50) {
              ...GatsbyContentfulFluid_withWebp
            }
          }
          blog {
            childMdx {
              body
              id
            }
          }
          biography {
            childMdx {
              body
              id
            }
          }
          colophon {
            childMdx {
              body
              id
            }
          }
          metaDescription {
            childMdx {
              body
              id
            }
          }
          metaImage {
            ogimg: resize(width: 1200, quality: 50) {
              src
              width
              height
            }
          }
        }
      }
    `
  )
  return contentfulConfig
}
