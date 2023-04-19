import addMdx from "@next/mdx";

const nextConfig = {
  experimental: {
    appDir: true,
    mdxRs: true,
  },
  images: {
    domains: [
      "pub-8bcf4a42832e4273a5a34c696ccc1b55.r2.dev",
      "i.imgur.com",
      "i.seadn.io",
      "api.zora.co",
      "ipfs.io",
      "gateway.ipfs.io",
      "ipfs.foundation.app",
    ],
  },
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    config.externals.push({
      "utf-8-validate": "commonjs utf-8-validate",
      bufferutil: "commonjs bufferutil",
    });
    return config;
  },
};

addMdx(nextConfig);

export default nextConfig;
