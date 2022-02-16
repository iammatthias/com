import axios from 'axios'

export default async (req: any, res: any) => {
  const glassUser = 'iammatthias'
  const limit = '9'
  const url = `https://glass.photo/api/v2/users/${glassUser}/posts?limit=100`

  await axios
    .get(url)
    .then(({ data }) => {
      res.status(200).json({ data })
    })
    .catch(({ err }) => {
      res.status(400).json({ err })
    })
}
