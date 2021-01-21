import { useStaticQuery, graphql } from 'gatsby';

export const useSiteMetadata = () => {
  const meta = useStaticQuery(
    graphql`
      query {
        galleries: allContentfulGallery {
          edges {
            node {
              id
              title
              images {
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
    `
  );
  return meta;
};
