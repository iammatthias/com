const { createVanillaExtractPlugin } = require('@vanilla-extract/next-plugin');
const withVanillaExtract = createVanillaExtractPlugin();
const withPWA = require('next-pwa');

/** @type {import('next').NextConfig} */
/** @type {import('next-sitemap').IConfig} */

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['pbs.twimg.com'],
  },
  pwa: {
    dest: 'public',
  },
  async headers() {
    return [
      {
        source: '/fonts/:font*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, immutable, max-age=31536000',
          },
        ],
      },
    ];
  },
};

module.exports = withVanillaExtract(withPWA(nextConfig));
