export default function handler(req, res) {
  res
    .status(200)
    .json({
      name: 'Matthias Jordan',
      handle: 'iammatthias',
      work: 'Growth @ Tornado',
    })
}
