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
      {
        source: "/md/1670705920366",
        destination: "/content/8e38c961-fd4a-4fcf-a6cc-030303e7b85f",
        permanent: true,
      },
      {
        source: "/md/1670714294926",
        destination: "/content/46df966a-19d5-488a-b727-72f423d6d616",
        permanent: true,
      },
    ];
  },
};

const withMDX = require("@next/mdx")({});
module.exports = withMDX(nextConfig);
