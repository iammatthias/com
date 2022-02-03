// @ts-check

/**
 * @type {import('next').NextConfig}
 **/

import withMDX from '@next/mdx'

const nextConfig = {
  pageExtensions: ['js', 'jsx', 'ts', 'tsx', 'md', 'mdx'],
  images: {
    loader: 'custom',
    domains: ['images.ctfassets.net'],
    formats: [
      'image/avif',
      'image/webp',
      'image/jpeg',
      'image/png',
      'image/gif',
    ],
  },
  async redirects() {
    return [
      {
        source: '/photography/:slug',
        destination: '/work/:slug', // Matched parameters can be used in the destination
        permanent: true,
      },
      {
        source: '/about',
        destination: '/',
        permanent: true,
      },
    ]
  },
}

export default withMDX({ nextConfig })
