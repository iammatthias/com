import { useStaticQuery, graphql } from 'gatsby';

export const useSiteMetadataListBlog = () => {
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
      }
    `
  );
  return meta;
};
