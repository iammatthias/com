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
              updatedAt(formatString: "MMMM Do, YYYY")
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
