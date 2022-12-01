/** @type {import('next').NextConfig} */
const nextConfig = {
<<<<<<< HEAD
  experimental: {
    appDir: true,
    fontLoaders: [{ loader: '@next/font/google', options: { subsets: ['latin'] } }],
  },
  images: {
    domains: ['pub-8bcf4a42832e4273a5a34c696ccc1b55.r2.dev'],
=======
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    appDir: true,
>>>>>>> main
  },
};

module.exports = nextConfig;
