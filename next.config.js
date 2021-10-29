const withMDX = require('@next/mdx')({ extension: /\.mdx?$/ })
module.exports = withMDX({
  trailingSlash: true,
  pageExtensions: ['js', 'mdx'],
  images: {
    domains: ['images.ctfassets.net'],
    formats: ['image/avif', 'image/webp'],
  },
  async redirects() {
    return [
      {
        source: '/photography/:slug',
        destination: '/work/:slug', // Matched parameters can be used in the destination
        permanent: true,
      },
    ]
  },
})
