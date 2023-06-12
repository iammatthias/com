import nextMdx from "@next/mdx";

const withMDX = nextMdx({});

/** @type {import('next').NextConfig} nextConfig */
const nextConfig = {
  pageExtensions: ["ts", "tsx", "js", "jsx", "md", "mdx"],
  images: {
    dangerouslyAllowSVG: true,
    domains: [
      "pub-bad9d477a78045ea9f8c0d6fdad56d87.r2.dev",
      "wsrv.nl",
      "i.imgur.com",
    ],
  },
  experimental: {
    mdxRs: true,
  },
  async redirects() {
    return [
      {
        source: "/rss/feed.xml",
        destination: "/api/feed?type=rss",
        permanent: true,
      },
      {
        source: "/feed/rss.xml",
        destination: "/api/feed?type=rss",
        permanent: true,
      },
      {
        source: "/rss/feed.json",
        destination: "/api/feed?type=json",
        permanent: true,
      },
      {
        source: "/feed/json.xml",
        destination: "/api/feed?type=json",
        permanent: true,
      },
      {
        source: "/rss/atom.xml",
        destination: "/api/feed?type=atom",
        permanent: true,
      },
      {
        source: "/feed/atom.xml",
        destination: "/api/feed?type=atom",
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

const configExport = () => {
  const plugins = [withMDX];
  return plugins.reduce((acc, next) => next(acc), nextConfig);
};

export default configExport;
