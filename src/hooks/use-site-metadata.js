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
      }
    `
  );
  return meta;
};
