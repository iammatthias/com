const config = require('./src/utils/siteConfig')
let contentfulConfig

try {
  contentfulConfig = require('./.contentful')
} catch (e) {
  contentfulConfig = {
    production: {
      spaceId: process.env.SPACE_ID,
      accessToken: process.env.ACCESS_TOKEN,
    },
  }
} finally {
  const { spaceId, accessToken } = contentfulConfig.production
  if (!spaceId || !accessToken) {
    throw new Error('Contentful space ID and access token need to be provided.')
  }
}

module.exports = {
  siteMetadata: {
    siteUrl: config.siteUrl,
  },
  plugins: [
    'gatsby-plugin-react-helmet',
    'gatsby-plugin-styled-components',
    'gatsby-plugin-sharp',
    'gatsby-plugin-catch-links',
    {
      resolve: `gatsby-plugin-mdx`,
      options: {
        gatsbyRemarkPlugins: [
          {
            resolve: 'gatsby-remark-images',
            options: {
              maxWidth: 960,
              linkImagesToOriginal: false,
            },
          },
          {
            resolve: 'gatsby-remark-images-grid',
          },

          {
            resolve: 'gatsby-remark-prismjs',
            options: {
              classPrefix: 'language-',
              showLineNumbers: true,
            },
          },
          {
            resolve: '@raae/gatsby-remark-oembed',
            options: {
              providers: {
                exclude: ['Reddit', 'Flickr', 'Instagram', 'Twitter'],
              },
            },
          },
          'gatsby-remark-responsive-iframe',
        ],
      },
    },
    {
      resolve: 'gatsby-transformer-remark',
      options: {
        plugins: [
          {
            resolve: 'gatsby-remark-images-contentful',
            options: {
              maxWidth: 960,
              linkImagesToOriginal: false,
            },
          },
          {
            resolve: 'gatsby-remark-emojis',
            options: {
              // Deactivate the plugin globally (default: true)
              active: true,
              // Add a custom css class
              class: 'emoji-icon',
              // Select the size (available size: 16, 24, 32, 64)
              size: 64,
              // Add custom styles
              styles: {
                display: 'inline',
                margin: '0',
                'margin-top': '1px',
                position: 'relative',
                top: '5px',
                width: '25px',
              },
            },
          },
          {
            resolve: 'gatsby-remark-images-grid',
          },

          {
            resolve: 'gatsby-remark-prismjs',
            options: {
              classPrefix: 'language-',
              showLineNumbers: true,
            },
          },
          {
            resolve: '@raae/gatsby-remark-oembed',
            options: {
              providers: {
                exclude: ['Reddit', 'Flickr', 'Instagram', 'Twitter'],
              },
            },
          },
          'gatsby-remark-responsive-iframe',
        ],
      },
    },
    {
      resolve: 'gatsby-plugin-typography',
      options: {
        pathToConfigModule: 'src/utils/typography',
      },
    },
    {
      resolve: 'gatsby-plugin-manifest',
      options: {
        name: config.siteTitle,
        short_name: config.shortTitle,
        description: config.siteDescription,
        start_url: '/',
        background_color: config.backgroundColor,
        theme_color: config.themeColor,
        display: 'fullscreen',
        icon: `static${config.siteLogo}`,
      },
    },
    'gatsby-plugin-offline',
    {
      resolve: 'gatsby-plugin-canonical-urls',
      options: {
        siteUrl: config.siteUrl,
      },
    },

    {
      resolve: `gatsby-plugin-segment-js`,
      options: {
        prodKey: process.env.SEGMENT,
        devKey: 'h9OTk5FWbRbQadJLqGIAVMYfkIbmNEBE',
        trackPage: true,
      },
    },
    {
      resolve: 'gatsby-plugin-nprogress',
      options: {
        color: config.themeColor,
      },
    },
    {
      resolve: 'gatsby-source-contentful',
      options:
        process.env.NODE_ENV === 'development'
          ? contentfulConfig.development
          : contentfulConfig.production,
    },

    {
      resolve: 'gatsby-plugin-robots-txt',
    },

    'gatsby-plugin-catch-links',
    'gatsby-plugin-sitemap',
    'gatsby-plugin-netlify',
  ],
}
