require(`dotenv`).config({
  path: `.env.${process.env.NODE_ENV}`,
});

module.exports = {
  siteMetadata: {
    title: `iammatthias`,
    siteUrl: `https://iammatthias.com`,
    description: `A personal portfolio project`,
    author: `Matthias Jordan`,
  },
  // assetPrefix: `__GATSBY_RELATIVE_PATH__`,
  flags: {
    FAST_DEV: true,
    PARALLEL_SOURCING: true,
  },
  plugins: [
    // {
    //   resolve: `gatsby-plugin-webpack-bundle-analyser-v2`,
    //   options: {
    //     devMode: true,
    //     defaultSizes: `gzip`,
    //   },
    // },
    `gatsby-plugin-theme-ui`,
    `gatsby-plugin-loadable-components-ssr`,
    `gatsby-plugin-image`,
    `gatsby-plugin-react-helmet`,
    `gatsby-plugin-sitemap`,
    {
      resolve: `gatsby-plugin-manifest`,
      options: {
        name: `I AM MATTHIAS`,
        short_name: `IAM`,
        start_url: `/`,
        background_color: `#F4F2F1`,
        theme_color: `#0C0908`,
        display: `standalone`,
        icon: `src/images/icon.png`,
      },
    },
    `gatsby-plugin-mdx`,
    `gatsby-plugin-sharp`,
    `gatsby-transformer-sharp`,
    `gatsby-remark-images`,
    {
      resolve: `gatsby-plugin-google-fonts-v2`,
      options: {
        fonts: [
          {
            family: `Cormorant Garamond`,
            weights: [`300`, `700`],
          },
          {
            family: `Pacifico`,
          },
          {
            family: `Inconsolata`,
            weights: [`300`],
          },
        ],
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
    {
      resolve: `gatsby-source-contentful`,
      options: {
        spaceId: process.env.CONTENTFUL_SPACE_ID,
        accessToken: process.env.CONTENTFUL_ACCESS_TOKEN,
        host: process.env.CONTENTFUL_HOST,
      },
    },
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        name: `pages`,
        path: `./src/pages/`,
      },
      __key: `pages`,
    },
    // {
    //   resolve: `gatsby-plugin-feed-generator`,
    //   options: {
    //     generator: `GatsbyJS`,
    //     rss: false, // Set to true to enable rss generation
    //     json: true, // Set to true to enable json feed generation
    //     siteQuery: `
    //   {
    //     site {
    //       siteMetadata {
    //         title
    //         description
    //         siteUrl
    //         author
    //       }
    //     }
    //   }
    // `,
    //     feeds: [
    //       {
    //         name: `feed`, // This determines the name of your feed file => feed.json & feed.xml
    //         query: `
    //     {
    //     listGallery: allContentfulPage(
    //       filter: { pageType: { eq: "Gallery" } }
    //       sort: { order: DESC, fields: publishDate }
    //     ) {
    //       edges {
    //         node {
    //           id
    //           title
    //           pageType
    //           slug
    //           publishDate: updatedAt(formatString: "MMMM DD, YYYY")
    //         }
    //       }
    //     }
    //     listBlog: allContentfulPage(
    //       filter: { pageType: { eq: "Blog" } }
    //       sort: { order: DESC, fields: publishDate }
    //     ) {
    //       edges {
    //         node {
    //           id
    //           title
    //           pageType
    //           slug
    //           publishDate(formatString: "MMMM DD, YYYY")
    //         }
    //       }
    //     }
    //   }
    //     `,
    //         normalize: ({ query: { site, listGallery, listBlog } }) => {
    //           let posts = listBlog.edges.map((edge) => {
    //             return {
    //               title: edge.node.title,
    //               slug: edge.node.slug,
    //               url: site.siteMetadata.siteUrl + `/blog/` + edge.node.slug,
    //               content: edge.node.pageType,
    //               date: edge.node.publishDate,
    //             };
    //           });
    //           let photos = listGallery.edges.map((edge) => {
    //             return {
    //               title: edge.node.title,
    //               slug: edge.node.slug,
    //               url: site.siteMetadata.siteUrl + `/photography/` + edge.node.slug,
    //               content: edge.node.pageType,
    //               date: edge.node.publishDate,
    //             };
    //           });
    //           let combined = [...photos, ...posts].sort((a, b) => {
    //             return new Date(a) - new Date(b);
    //           });
    //           return combined;
    //         },
    //       },
    //     ],
    //   },
    // },
    // {
    //   resolve: 'gatsby-plugin-relative-paths',
    //   options: {
    //     assetFolder: 'public/',
    //   },
    // },
  ],
};
