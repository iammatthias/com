module.exports.data = {
  photography: `{
    allContentfulPhotography(sort: { fields: [publishDate], order: DESC }) {
      edges {
        node {
          slug
          publishDate
        }
      }
    }
  }`,
  posts: `{
    allContentfulPost(sort: { fields: [publishDate], order: DESC }) {
      edges {
        node {
          slug
          publishDate
        }
      }
    }
  }`,
  pages: `{
    allContentfulPage {
      edges {
        node {
          slug
        }
      }
    }
  }`,
  tags: `{
    allContentfulTag {
      edges {
        node {
          slug
          post {
            id
          }
        }
      }
    }
  }`,
}
