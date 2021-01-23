import { useStaticQuery, graphql } from 'gatsby';

export const useSiteMetadata = () => {
  const meta = useStaticQuery(
    graphql`
      query {
        listGallery: allContentfulPage(
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
        listBlog: allContentfulPage(
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
      }
    `
  );
  return meta;
};
