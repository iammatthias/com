// lib/feed

import { Feed } from 'feed'
import { ApolloClient, InMemoryCache, gql } from '@apollo/client'

export const buildFeed = async () => {
  const client = new ApolloClient({
    uri: `https://graphql.contentful.com/content/v1/spaces/${process.env.NEXT_PUBLIC_CONTENTFUL_SPACE_ID}/?access_token=${process.env.NEXT_PUBLIC_CONTENTFUL_ACCESS_TOKEN}`,
    cache: new InMemoryCache(),
    credentials: 'same-origin',
  })

  const { data } = await client.query({
    query: gql`
      query {
        pageCollection(
          order: publishDate_DESC
          where: { OR: [{ pageType: "Blog" }, { pageType: "Gallery" }] }
        ) {
          items {
            slug
            title
            publishDate
            pageType
          }
        }
      }
    `,
  })

  // This contains site level metadata like title, url, etc
  const feed = new Feed({
    // Global feed config
    id: 'https://iammatthias.com/',
    link: 'https://iammatthias.com/',
    title: 'I AM MATTHIAS',
    description: 'A digital garden',
    copyright: 'All rights reserved © 2005-2022, Matthias Jordan',
    language: 'en',
    feedLinks: {
      rss: 'https://iammatthias.com/api/feed/rss',
      json: 'https://iammatthias.com/api/feed/json',
    },
    author: {
      name: 'Matthias Jordan',
      email: 'hey@iammatthias.com',
      link: 'https://iammatthias.com/',
    },
  })

  const posts = data.pageCollection.items
  posts.forEach(post => {
    const link = `https://iammatthias.com/${post.slug}`
    feed.addItem({
      // Individual post config
      id: link,
      title: post.title,
      date: new Date(post.publishDate),
    })
  })

  return feed
}

export default buildFeed
