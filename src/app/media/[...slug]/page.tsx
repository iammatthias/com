import slugify from "slugify";
import { CustomMDX } from "@/app/lib/customMdx";
import { getSingleMedia } from "@/app/lib/notion";
import styles from "./page.module.scss";
import Comments from "@/app/components/comments";
import ZoraEmbed from "@/app/components/mdx/zora";

export interface Props {
  params: {
    slug: string;
  };
}

// export async function generateMetadata({ params }: Props) {
//   const post = await getSinglePost(params.slug[0]);

//   return {
//     openGraph: {
//       locale: "en_US",
//       url: "https://iammatthias.com",
//       title: `IAM ☾ ☼ ☽ // ${post.metadata.name}`,
//       description: `${post.metadata.name}`,
//       images: [
//         {
//           url: `api/og?title=${slugify(post.metadata.name)}`,
//           width: 1200,
//           height: 630,
//           alt: "iammatthias.com/bookmarks",
//         },
//       ],
//     },
//     twitter: {
//       card: "summary_large_image",
//       title: `IAM ☾ ☼ ☽ // ${post.metadata.name}`,
//       description: `${post.metadata.name}`,
//       creator: "@iammatthias",
//       images: [
//         {
//           url: `api/og?title=${slugify(post.metadata.name)}`,
//           width: 1200,
//           height: 630,
//           alt: "iammatthias.com/bookmarks",
//         },
//       ],
//     },
//   };
// }

export default async function Post({ params }: Props) {
  if (!params?.slug) {
    return <>Loading...</>;
  }

  const post = (await getSingleMedia(params.slug[0], params.slug[1])) as any;

  return (
    <>
      <CustomMDX source={post.markdown.parent} />

      {post.page.properties.tokenAddress?.rich_text[0].plain_text && (
        <ZoraEmbed
          address={`${post.page.properties.tokenAddress.rich_text[0].plain_text}`}
        />
      )}

      {/* <Comments slug={params.slug} /> */}
    </>
  );
}
