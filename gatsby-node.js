const { createFilePath } = require(`gatsby-source-filesystem`);
exports.onCreateNode = ({ node, actions, getNode }) => {
  const { createNodeField } = actions;
  if (node.internal.type === `contentfulPage`) {
    if (node.title === `home`) {
      null;
    } else {
      const value = createFilePath({ node, getNode });
      createNodeField({
        name: `slug`,
        node,
        value,
      });
    }
  }
};
