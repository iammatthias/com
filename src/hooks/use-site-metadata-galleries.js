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
                title
                gatsbyImageData(layout: FULL_WIDTH, placeholder: DOMINANT_COLOR)
              }
            }
          }
        }
      }
    `
  );
  return meta;
};
