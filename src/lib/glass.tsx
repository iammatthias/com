export async function getGlassPosts({ limit, offset }: { limit: number; offset: number }) {
  const data = await fetch(`https://glass.photo/api/v2/users/iam/posts?limit=${limit}&offset=${offset}`, {
    method: `GET`,
    headers: {
      "Content-Type": `application/json`,
    },
    next: {
      revalidate: 1 * 30,
    },
  }).then((res) => res.json());

  return Promise.all(
    data.map(async (post: any) => {
      // Process each post here
      // For example, return post.title;
      return { post };
    })
  );
}
