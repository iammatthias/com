import { useQuery, gql } from '@apollo/client'
import { Feed } from 'feed'
import { fs } from 'fs'

async function generateRssFeed() {
  if (process.env.NODE_ENV === 'development') {
    return
  }

  const baseUrl = process.env.BASE_URL
  const date = new Date()
  const author = {
    name: 'Matthias Jordan',
    email: 'hey@iammatthias.com',
    link: 'https://twitter.com/iammatthias',
  }

  const feed = new Feed({
    title: `I AM MATTHIAS`,
    description: 'Photographer & Growth Marketer',
    id: baseUrl,
    link: baseUrl,
    language: 'en',
    image: `${baseUrl}/images/logo.svg`,
    favicon: `${baseUrl}/favicon.ico`,
    copyright: `All rights reserved ${date.getFullYear()}, Matthias Jordan`,
    updated: date,
    generator: 'Next.js using Feed for Node.js',
    feedLinks: {
      rss2: `${baseUrl}/rss/feed.xml`,
      json: `${baseUrl}/rss/feed.json`,
      atom: `${baseUrl}/rss/atom.xml`,
    },
    author,
  })

  const QUERY = gql`
   query {
     pageCollection(
       order: publishDate_DESC
       where: { pageType: 'Blog' OR pageType: 'Gallery' }
     ) {
       items {
         slug
         title
         publishDate
       }
     }
   }
 `

  const { data, loading, error } = useQuery(QUERY)

  if (loading) {
    return 'Loading...'
  }

  if (error) {
    console.error(error)
    return null
  }

  const posts = data.pageCollection.items

  posts.forEach(post => {
    const url = `${baseUrl}/${post.slug}`
    feed.addItem({
      title: post.title,
      id: url,
      link: url,
      author: [author],
      contributor: [author],
      date: new Date(post.publishDate),
    })
  })

  fs.mkdirSync('./public/rss', { recursive: true })
  fs.writeFileSync('./public/rss/feed.xml', feed.rss2())
  fs.writeFileSync('./public/rss/atom.xml', feed.atom1())
  fs.writeFileSync('./public/rss/feed.json', feed.json1())
}

export default generateRssFeed
