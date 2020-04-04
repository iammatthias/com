import { useStaticQuery, graphql } from 'gatsby'

export const useRandomHero = () => {
  const { site } = useStaticQuery(
    graphql`
      query randomHero {
        allContentfulPhotography {
          edges {
            node {
              heroImage {
                thumbnail: fluid(maxWidth: 200, quality: 50) {
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
  )
  return site.randomHero
}
