const path = require('path');
// Implement the Gatsby API “createPages”. This is called once the
// data layer is bootstrapped to let plugins create pages from data.
exports.createPages = async ({ graphql, actions, reporter }) => {
  const { createPage } = actions;
  // Query for markdown nodes to use in creating pages.
  const result = await graphql(
    `
      {
        pages: allContentfulPage(
          filter: { pageType: { eq: "Page" }, slug: { ne: "home" } }
        ) {
          edges {
            node {
              id
              slug
            }
          }
        }
        blog: allContentfulPage(
          filter: { pageType: { eq: "Blog" } }
          sort: { order: DESC, fields: publishDate }
        ) {
          edges {
            previous {
              id
              slug
            }
            next {
              id
              slug
            }
            node {
              id
              slug
              publishDate(formatString: "MMMM Do, YYYY")
            }
          }
        }
        gallery: allContentfulPage(filter: { pageType: { eq: "Gallery" } }) {
          edges {
            node {
              id
              slug
            }
          }
        }
      }
    `
  );
  // Handle errors
  if (result.errors) {
    reporter.panicOnBuild(`Error while running GraphQL query.`);
    return;
  }
  // Create pages for each Contentful page.
  const pageTemplate = path.resolve(`src/templates/page.js`);
  result.data.pages.edges.forEach(({ node }) => {
    createPage({
      path: node.slug,
      component: pageTemplate,
      context: {
        id: node.id,
        pagePath: node.slug,
      },
    });
  });
  result.data.blog.edges.forEach(({ node, next, previous }) => {
    createPage({
      path: 'blog/' + node.slug,
      component: pageTemplate,
      context: {
        id: node.id,
        pagePath: node.slug,
        next,
        previous,
      },
    });
  });
  result.data.gallery.edges.forEach(({ node }) => {
    createPage({
      path: 'photography/' + node.slug,
      component: pageTemplate,
      context: {
        id: node.id,
        pagePath: node.slug,
      },
    });
  });
};

module.exports.onCreatePage = ({ page, actions }) => {
  const { deletePage } = actions;

  if (page.path === 'home/') {
    deletePage(page);
  }
};
