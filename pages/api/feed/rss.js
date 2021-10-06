import { buildFeed } from '../../../lib/feed'

export default async (req, res) => {
  const feed = await buildFeed()

  res.statusCode = 200
  res.setHeader('content-type', 'application/rss+xml')
  res.end(feed.rss2())
}
