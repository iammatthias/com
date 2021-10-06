import { buildFeed } from '../../../lib/feed'

export default async (req, res) => {
  res.statusCode = 200
  res.setHeader('content-type', 'application/feed+json')
  res.end((await buildFeed()).json1())
}
