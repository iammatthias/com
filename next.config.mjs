import nextMdx from "@next/mdx";
import withPlaiceholder from "@plaiceholder/next";

const withMDX = nextMdx({});

/** @type {import('next').NextConfig} nextConfig */
const nextConfig = {
  pageExtensions: ["ts", "tsx", "js", "jsx", "md", "mdx"],
  images: {
    dangerouslyAllowSVG: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "pub-bad9d477a78045ea9f8c0d6fdad56d87.r2.dev",
      },
      {
        protocol: "https",
        hostname: "wsrv.nl",
      },
      {
        protocol: "https",
        hostname: "i.imgur.com",
      },
      {
        protocol: "https",
        hostname: "v5.airtableusercontent.com",
      },
      {
        protocol: "https",
        hostname: "cdn.glass.photo",
      },
      {
        protocol: "https",
        hostname: "ipfs.io",
      },
      {
        protocol: "https",
        hostname: "silver-bitter-junglefowl-364.mypinata.cloud",
      },
    ],
  },
  experimental: {
    mdxRs: true,
  },
  async redirects() {
    return [
      {
        source: "/md/:slug*",
        destination: "/", // Matched parameters can be used in the destination
        permanent: true,
      },
    ];
  },
};

const configExport = () => {
  const plugins = [withMDX, withPlaiceholder];
  return plugins.reduce((acc, next) => next(acc), nextConfig);
};

export default configExport;
