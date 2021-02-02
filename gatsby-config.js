require('dotenv').config({
  path: `.env.${process.env.NODE_ENV}`,
});

module.exports = {
  siteMetadata: {
    title: 'iammatthias',
    siteUrl: 'https://iammatthias.com',
  },
  plugins: [
    {
      resolve: 'gatsby-source-contentful',
      options: {
        spaceId: process.env.CONTENTFUL_SPACE_ID,
        accessToken: process.env.CONTENTFUL_ACCESS_TOKEN,
        host: process.env.CONTENTFUL_HOST,
      },
    },
    {
      resolve: `gatsby-plugin-segment-js`,
      options: {
        prodKey: process.env.SEGMENT,
        devKey: process.env.SEGMENT,
        trackPage: true,
      },
    },
    'gatsby-plugin-theme-ui',
    'gatsby-plugin-sharp',
    'gatsby-plugin-react-helmet',
    // `gatsby-plugin-image`,
    `gatsby-plugin-sharp`,
    `gatsby-remark-images`,
    {
      resolve: `gatsby-plugin-mdx`,
      options: {
        gatsbyRemarkPlugins: [
          {
            resolve: `gatsby-remark-images`,
            options: {
              maxWidth: 1200,
            },
          },
        ],
      },
    },
    {
      resolve: 'gatsby-source-filesystem',
      options: {
        name: 'pages',
        path: './src/pages/',
      },
      __key: 'pages',
    },
    {
      resolve: `gatsby-plugin-google-fonts-v2`,
      options: {
        fonts: [
          {
            family: 'Cormorant Garamond',
            weights: ['300', '700'],
          },
          {
            family: 'Lobster Two',
            weights: ['400'],
          },
          {
            family: 'Inconsolata',
            weights: ['400'],
          },
        ],
      },
    },
    'gatsby-plugin-sitemap',
    'gatsby-plugin-offline',
  ],
};
