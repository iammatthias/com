import slugify from "slugify";
import { CustomMDX } from "@/app/lib/customMdx";
import { getSinglePost, getAllPublished } from "@/app/lib/notion";
import styles from "./page.module.scss";
import Comments from "@/app/components/comments";
import ZoraEmbed from "@/app/components/mdx/zora";

// revalidate every 60 seconds
export const revalidate = 60;

// Return a list of `params` to populate the [slug] dynamic segment
export async function generateStaticParams() {
  const posts = await getAllPublished();

  return posts.map((post: any) => ({
    slug: post.slug,
  }));
}

export interface Props {
  params: {
    slug: string;
  };
}

export async function generateMetadata({ params }: Props) {
  const post = await getSinglePost(params.slug);

  return {
    openGraph: {
      locale: "en_US",
      url: "https://iammatthias.com",
      title: `IAM ☾ ☼ ☽ // ${post.metadata.name}`,
      description: `${post.metadata.name}`,
      images: [
        {
          url: `api/og?title=${slugify(post.metadata.name)}`,
          width: 1200,
          height: 630,
          alt: "iammatthias.com/bookmarks",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `IAM ☾ ☼ ☽ // ${post.metadata.name}`,
      description: `${post.metadata.name}`,
      creator: "@iammatthias",
      images: [
        {
          url: `api/og?title=${slugify(post.metadata.name)}`,
          width: 1200,
          height: 630,
          alt: "iammatthias.com/bookmarks",
        },
      ],
    },
  };
}

export default async function Post({ params }: Props) {
  if (!params?.slug) {
    return <>Loading...</>;
  }

  const post = await getSinglePost(params.slug);

  function localDateString(date: string) {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  return (
    <>
      <div className={`${styles.post__meta}`}>
        <h1>{post.metadata.name}</h1>
        <div className={`${styles.post__dates}`}>
          <p>Published: {localDateString(post.metadata.created)}</p>
          <p>Updated: {localDateString(post.metadata.updated)}</p>
        </div>
        <div className={`${styles.post__tags}`}>
          {post.metadata.tags.map((tag) => (
            <span key={tag} className={`${styles.post__tag}`}>
              {tag}
            </span>
          ))}
        </div>
        <hr />
      </div>

      <CustomMDX source={post.markdown.parent} />

      {post.metadata.tokenAddress && (
        <ZoraEmbed address={`${post.metadata.tokenAddress}`} />
      )}

      <Comments slug={params.slug} />
    </>
  );
}
