module.exports.onCreatePage = ({ page, actions }) => {
  const { deletePage } = actions;

  if (page.path === '/home/') {
    deletePage(page);
  }
};
