import { useStaticQuery, graphql } from 'gatsby';

export const useSiteMetadataListGalleries = () => {
  const meta = useStaticQuery(
    graphql`
      query {
        galleries: allContentfulPage(
          filter: { pageType: { eq: "Gallery" } }
          sort: { order: DESC, fields: publishDate }
        ) {
          edges {
            node {
              id
              title
              pageType
              slug
              publishDate: updatedAt(formatString: "MMMM Do, YYYY")
            }
          }
        }
      }
    `
  );
  return meta;
};
