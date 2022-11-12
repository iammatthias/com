/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  images: {
    domains: ["cdn.statically.io", "picsum.photos"],
  },
};

module.exports = nextConfig;
