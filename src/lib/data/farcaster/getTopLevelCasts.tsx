export default async function getTopLevelCasts(slug: string) {
  const uri = `https://searchcaster.xyz/api/search?text=${slug}`;

  const res = await fetch(uri, {
    next: {
      revalidate: 5 * 60,
    },
  }).then((res) => res.json());
  const casts = res.casts;
  return casts;
}

// Explore switching API to Discove from SearchCaster
// Experimental, do not use in production yet

// export async function getCommentCasts(slug: string) {
//   // https://www.discove.xyz/api/feeds?sql=select+*+from+casts+WHERE+casts.text+ILIKE+%27%251670714294926%25%27
//   // https://www.discove.xyz/api/feeds?sql=select+*+from+casts+WHERE+casts.text+ILIKE+%27%25${slug}%25%27
//   const uri = `https://www.discove.xyz/api/feeds?sql=select+*+from+casts+WHERE+casts.text+ILIKE+%27%25${slug}%25%27`;
//   const res = await fetch(uri, {
//     next: {
//       revalidate: 5 * 60,
//     },
//   });

//   // Recommendation: handle errors
//   if (!res.ok) {
//     // This will activate the closest `error.js` Error Boundary
//     throw new Error("Failed to fetch data");
//   }

//   const casts = res.json;

//   return null;
// }
