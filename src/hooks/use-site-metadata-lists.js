import { useStaticQuery, graphql } from 'gatsby';

export const useSiteMetadataList = () => {
  const meta = useStaticQuery(
    graphql`
      query {
        posts: allContentfulPage(
          filter: { pageType: { eq: "Blog" } }
          sort: { order: DESC, fields: publishDate }
        ) {
          edges {
            node {
              id
              title
              pageType
              slug
              publishDate(formatString: "MMMM Do, YYYY")
            }
          }
        }
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
