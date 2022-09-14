// glass.js
// Language: typescript

// Queries last 100 images from https://glass.photo/iammatthias

import axios from 'axios';

export default async function getPosts(req, res) {
  const glassUser = `iammatthias`;
  const limit = `100`;
  const url = `https://glass.photo/api/v2/users/${glassUser}/posts?limit=${limit}`;

  if (req) {
    await axios
      .get(url)
      .then(({ data }) => {
        res.status(200).json({ data });
      })
      .catch(({ err }) => {
        res.status(400).json({ err });
      });
  }
}
