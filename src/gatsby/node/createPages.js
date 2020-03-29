const config = require('../../../gatsby-config')
const query = require('../data/query')
const path = require(`path`)
const { paginate } = require(`gatsby-awesome-pagination`)

module.exports = async ({ graphql, actions }) => {
  const { createPage } = actions

  const basePath = config.siteMetadata.basePath || '/'

  // Create a page for each "photo set"
  const photographyQuery = await graphql(query.data.photography)
  const photography = photographyQuery.data.allContentfulPhotography.edges
  photography.forEach((photoSet, i) => {
    createPage({
      path: `${basePath === '/' ? '' : basePath}/photography/${
        photoSet.node.slug
      }/`,
      component: path.resolve(`./src/templates/photoSet.js`),
      context: {
        slug: photoSet.node.slug,
        basePath: `${basePath}photography`,
        paginationPath: `${basePath}photography`,
      },
    })
  })
  // Create a page containing all "photo sets" and paginate.
  paginate({
    createPage,
    path: `photography/`,
    component: path.resolve(`./src/templates/photography.js`),
    items: photography,
    itemsPerFirstPage: config.siteMetadata.postsPerFirstPage || 7,
    itemsPerPage: config.siteMetadata.postsPerPage || 6,
    pathPrefix: `${basePath}photography`,
    context: {
      basePath: basePath === '/' ? '' : `${basePath}photography`,
      paginationPath: basePath === '/' ? '' : `${basePath}photography`,
    },
  })

  // Create a page for each "post"
  const postsQuery = await graphql(query.data.posts)
  const posts = postsQuery.data.allContentfulPost.edges
  posts.forEach((post, i) => {
    const next = i === posts.length - 1 ? null : posts[i + 1].node
    const prev = i === 0 ? null : posts[i - 1].node

    createPage({
      path: `${basePath === '/' ? '' : basePath}/blog/${post.node.slug}/`,
      component: path.resolve(`./src/templates/post.js`),
      context: {
        slug: post.node.slug,
        basePath: `${basePath}blog`,
        paginationPath: `${basePath}blog`,
        prev,
        next,
      },
    })
  })

  // Create a page containing all "posts" and paginate.
  paginate({
    createPage,
    path: `blog/`,
    component: path.resolve(`./src/templates/posts.js`),
    items: posts,
    itemsPerFirstPage: config.siteMetadata.postsPerFirstPage || 7,
    itemsPerPage: config.siteMetadata.postsPerPage || 6,
    pathPrefix: `${basePath}blog`,
    context: {
      basePath: basePath === '/' ? '' : `${basePath}blog`,
      paginationPath: basePath === '/' ? '' : `${basePath}blog`,
    },
  })

  // Create "tag" page and paginate
  const tagsQuery = await graphql(query.data.tags)
  const tags = tagsQuery.data.allContentfulTag.edges

  tags.forEach((tag, i) => {
    const tagPagination =
      basePath === '/'
        ? `/tag/${tag.node.slug}`
        : `/${basePath}/tag/${tag.node.slug}`

    paginate({
      createPage,
      component: path.resolve(`./src/templates/tag.js`),
      items: tag.node.post || [],
      itemsPerPage: config.siteMetadata.postsPerPage || 6,
      pathPrefix: tagPagination,
      context: {
        slug: tag.node.slug,
        basePath: basePath === '/' ? '' : basePath,
        paginationPath: tagPagination,
      },
    })
  })

  // Create a page for each "page"
  const pagesQuery = await graphql(query.data.pages)
  const pages = pagesQuery.data.allContentfulPage.edges
  pages.forEach((page, i) => {
    createPage({
      path: `/${page.node.slug}/`,
      component: path.resolve(`./src/templates/page.js`),
      context: {
        slug: page.node.slug,
        title: page.node.title,
      },
    })
  })
}
