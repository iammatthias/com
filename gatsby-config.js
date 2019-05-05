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
    rssMetadata: {
      site_url: config.siteUrl,
      title: config.siteTitle,
      description: config.siteDescription,
      image_url: `${config.siteUrl}${config.siteLogo}`,
      author: config.author,
      copyright: config.copyright,
    },
  },
  plugins: [
    `gatsby-plugin-flow`,
    'gatsby-plugin-react-helmet',
    'gatsby-plugin-styled-components',
    {
      resolve: `gatsby-transformer-remark`,
      options: {
        plugins: [
          {
            resolve: `gatsby-remark-prismjs`,
            options: {
              classPrefix: 'language-',
              showLineNumbers: true,
            },
          },
          {
            resolve: `@raae/gatsby-remark-oembed`,
            options: {
              providers: {
                exclude: ['Reddit', 'Flickr', 'Instagram', 'Twitter'],
              },
            },
          },
          `gatsby-remark-responsive-iframe`,
          {
            resolve: 'gatsby-remark-images-contentful',
            options: {
              maxWidth: 750,
              backgroundColor: 'transparent',
              linkImagesToOriginal: false,
              withWebp: true,
            },
          },
        ],
      },
    },
    {
      resolve: `gatsby-plugin-typography`,
      options: {
        pathToConfigModule: `src/utils/typography`,
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
      resolve: 'gatsby-plugin-google-analytics',
      options: {
        trackingId: process.env.GOOGLE_ANALYTICS,
        head: true,
      },
    },
    {
      resolve: `gatsby-plugin-amplitude-analytics`,
      options: {
        // Specify the API key for your Amplitude Project (required)
        apiKey: process.env.AMPLITUDE,
        // Puts tracking script in the head instead of the body (optional)
        head: false,
        // Prevents loading Amplitude and logging events if visitors have "Do Not Track" enabled (optional)
        respectDNT: true,
        // Override the default event types (optional)
        eventTypes: {
          outboundLinkClick: 'OUTBOUND_LINK_CLICK',
          pageView: 'PAGE_VIEW',
        },
        // Amplitude JS SDK configuration options (optional)
        amplitudeConfig: {
          saveEvents: true,
          includeUtm: true,
          includeReferrer: true,
        },
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

    'gatsby-plugin-catch-links',
    'gatsby-plugin-sitemap',
    'gatsby-plugin-netlify',
  ],
}
