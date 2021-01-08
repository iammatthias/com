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
            }
          }
        }
        listBlog: allContentfulPage(filter: { pageType: { eq: "Blog" } }) {
          edges {
            node {
              id
              title
              pageType
              slug
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
          masonry {
            display
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
    `
  );
  return meta;
};
