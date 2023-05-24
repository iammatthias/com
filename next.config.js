/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    mdxRs: true,
  },
  images: {
    domains: ["pub-bad9d477a78045ea9f8c0d6fdad56d87.r2.dev", "wsrv.nl"],
  },
  async redirects() {
    return [
      {
        source: "/rss/feed.xml",
        destination: "/feed/rss.xml",
        permanent: true,
      },
      {
        source: "/rss/feed.json",
        destination: "/feed/json.json",
        permanent: true,
      },
    ];
  },
};

const withMDX = require("@next/mdx")({});
module.exports = withMDX(nextConfig);
