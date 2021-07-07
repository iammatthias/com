const NodePolyfillPlugin = require('node-polyfill-webpack-plugin');

exports.onCreateWebpackConfig = ({ actions }) => {
  actions.setWebpackConfig({
    plugins: [new NodePolyfillPlugin()],
  });
};
