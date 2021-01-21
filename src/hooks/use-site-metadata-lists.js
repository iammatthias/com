import { useStaticQuery, graphql } from 'gatsby';

export const useSiteMetadata = () => {
  const meta = useStaticQuery(
    graphql`
      query {
        listPages: allContentfulPage(filter: { pageType: { eq: "Page" } }) {
          edges {
            node {
              id
              title
              pageType
              slug
            }
          }
        }
        listGallery: allContentfulPage(
          filter: { pageType: { eq: "Gallery" } }
          sort: { fields: publishDate }
        ) {
          edges {
            node {
              id
              title
              pageType
              slug
              publishDate
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
              publishDate
            }
          }
        }
      }
    `
  );
  return meta;
};
