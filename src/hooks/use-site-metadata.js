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
              body {
                childMdx {
                  body
                }
              }
              masonry {
                id
                title
                display
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
        ) {
          edges {
            node {
              id
              title
              pageType
              slug
              masonry {
                images {
                  id
                  fluid(maxWidth: 300) {
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
        contentfulPage {
          id
          wrappedLayout
          pageType
          slug
          title
          body {
            childMdx {
              body
            }
          }
        }
      }
    `
  );
  return meta;
};
