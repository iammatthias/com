import nextMdx from "@next/mdx";
import withPlaiceholder from "@plaiceholder/next";

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
      "v5.airtableusercontent.com",
      "cdn.glass.photo",
      "https://ipfs.io/ipfs/",
    ],
  },
  experimental: {
    mdxRs: true,
  },
};

const configExport = () => {
  const plugins = [withMDX, withPlaiceholder];
  return plugins.reduce((acc, next) => next(acc), nextConfig);
};

export default configExport;
