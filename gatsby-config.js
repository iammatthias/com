require('dotenv').config({
  path: `.env.${process.env.NODE_ENV}`,
})

module.exports = {
  siteMetadata: {
    title: 'I AM MATTHIAS',
    description: 'A personal portfolio project',
    siteUrl: 'https://iammatthias.com',
    menuLinks: [
      {
        name: 'Home',
        slug: '/',
      },
      {
        name: 'Photography',
        slug: '/photography/',
      },
      {
        name: 'Blog',
        slug: '/blog/',
      },
      {
        name: 'About',
        slug: '/about/',
      },
    ],
    postsPerFirstPage: 6,
    postsPerPage: 6,
    basePath: '/',
  },
  plugins: [
    'gatsby-plugin-emotion',
    'gatsby-plugin-theme-ui',

    'gatsby-plugin-react-helmet',
    {
      resolve: `gatsby-plugin-printer`,
      options: {
        puppeteerLaunchOptions: {
          headless: true,
        },
      },
    },
    {
      resolve: `gatsby-plugin-google-fonts`,
      options: {
        fonts: [`Montserrat:400,900`, `Crimson Text`, `Inconsolata`],
        display: 'swap',
      },
    },
    {
      resolve: `gatsby-plugin-mdx`,
    },
    {
      resolve: `gatsby-transformer-remark`,
      options: {
        plugins: [
          {
            resolve: `gatsby-remark-prismjs`,
          },
          `gatsby-remark-emojis`,
          `gatsby-remark-autolink-headers`,
          {
            resolve: `gatsby-remark-images-contentful`,
            options: {
              maxWidth: 650,
              backgroundColor: 'white',
              linkImagesToOriginal: false,
            },
          },
        ],
      },
    },
    `gatsby-plugin-catch-links`,
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
    'gatsby-plugin-sitemap',
    {
      resolve: 'gatsby-plugin-manifest',
      options: {
        name: 'I AM MATTIAS',
        short_name: 'IAM',
        start_url: '/',
        background_color: '#140D00',
        theme_color: '#140D00',
        display: 'minimal-ui',
        icon: './static/images/favicon.png',
      },
    },
    'gatsby-plugin-offline',
    {
      resolve: `gatsby-plugin-schema-snapshot`,
      options: {
        path: `./src/gatsby/schema/schema.gql`,
        update: process.env.GATSBY_UPDATE_SCHEMA_SNAPSHOT,
      },
    },
    'gatsby-plugin-netlify',
  ],
}
