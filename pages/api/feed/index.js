export default function handler(req, res) {
  res.status(200).json({
    name: 'Matthias Jordan',
    email: 'hey@iammatthias.com',
    handle: 'iammatthias',
    role: 'growth',
    company: 'Tornado',
    web: 'iammatthias.com/',
    twitter: 'twitter.com/',
    git: 'github.com/',
  })
}
