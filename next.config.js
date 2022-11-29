/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
    fontLoaders: [
      { loader: '@next/font/google', options: { subsets: ['latin'] } },
    ],
  },
  images: {
    domains: ['pub-8bcf4a42832e4273a5a34c696ccc1b55.r2.dev'],
  },
};

module.exports = nextConfig;
