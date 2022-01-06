export default function handler(req, res) {
  res.status(200).json({
    name: 'Matthias Jordan',
    email: 'hey@iammatthias.com',
    handle: 'iammatthias',
    company: 'Tornado',
    twitter: 'twitter.com/',
    git: 'github.com/',
  })
}
