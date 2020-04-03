module.exports.data = {
  site: `allSitePage {
    edges {
      node {
        id
        context {
          title
          slug
        }
      }
    }
  }`,
  photography: `{
    allContentfulPhotography(sort: { fields: [publishDate], order: DESC }) {
      edges {
        node {
          id
          title
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
          id
          title
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
          id
          title
          slug
        }
      }
    }
  }`,
  tags: `{
    allContentfulTag {
      edges {
        node {
          id
          title
          slug
          post {
            id
          }
        }
      }
    }
  }`,
}
