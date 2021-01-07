import { useStaticQuery, graphql } from 'gatsby';
export const useSiteMetadata = () => {
  const meta = useStaticQuery(
    graphql`
      query {
        allContentfulPage {
          edges {
            node {
              id
              title
              pageType
              slug
              masonry {
                title
                images {
                  title
                  fluid {
                    ...GatsbyContentfulFluid_withWebp
                    aspectRatio
                    src
                    srcSet
                  }
                }
              }
            }
          }
        }
        page: allContentfulPage(filter: { pageType: { eq: "Page" } }) {
          edges {
            node {
              id
              title
              pageType
              slug
              masonry {
                title
                images {
                  title
                  fluid {
                    ...GatsbyContentfulFluid_withWebp
                    aspectRatio
                    src
                    srcSet
                  }
                }
              }
            }
          }
        }
        gallery: allContentfulPage(filter: { pageType: { eq: "Gallery" } }) {
          edges {
            node {
              id
              title
              pageType
              slug
              masonry {
                title
                images {
                  title
                  fluid {
                    ...GatsbyContentfulFluid_withWebp
                    aspectRatio
                    src
                    srcSet
                  }
                }
              }
            }
          }
        }
        blog: allContentfulPage(filter: { pageType: { eq: "Blog" } }) {
          edges {
            node {
              id
              title
              pageType
              slug
              masonry {
                title
                images {
                  title
                  fluid {
                    ...GatsbyContentfulFluid_withWebp
                    aspectRatio
                    src
                    srcSet
                  }
                }
              }
            }
          }
        }
      }
    `
  );
  return meta;
};
