const withMDX = require('@next/mdx')({ extension: /\.mdx?$/ })
module.exports = withMDX({
  exportTrailingSlash: true,
  pageExtensions: ['js', 'mdx'],
  images: {
    domains: ['images.ctfassets.net'],
  },
})
