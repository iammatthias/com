import Squiggle from "@/components/squiggle";
import { CustomMDX } from "@/lib/custom_mdx";

import styles from "./page.module.css";
import { getObsidianEntry, getObsidianEntries } from "@/lib/obsidian";

// import Nav from "@/app/components/nav";
import Back from "@/components/back";
import Onchain from "@/components/onchain";
import { Suspense } from "react";
import Loader from "@/components/loader";

// revalidate every 60 seconds
export const revalidate = 60;

export const maxDuration = 30;

export default async function Post({ params }: Props) {
  const post = await getObsidianEntry(params.slug);

  return (
    <section>
      <h1>{post.name}</h1>

      <p className={styles.date}>
        This post was published {new Date(post.created).toLocaleDateString("sv-SE").replace(/-/g, "/")}{" "}
        {post.updated !== post.created &&
          `& last updated ${new Date(post.updated).toLocaleDateString("sv-SE").replace(/-/g, "/")}`}
      </p>

      {post.tags && (
        <div className={styles.pill_box}>
          {post.tags.map((item: string, i: any) => (
            <span className={styles.pill} key={i}>
              {item}
            </span>
          ))}
        </div>
      )}
      <Squiggle />
      <article>
        {post.address && (
          // <Suspense fallback={<Loader />}>
          //   <Onchain address={post.address} />
          // </Suspense>
          <Onchain address={post.address} />
        )}
        <CustomMDX source={post.body} />
      </article>

      <Back />
    </section>
  );
}

// Return a list of `params` to populate the [slug] dynamic segment
export async function generateStaticParams() {
  const posts = await getObsidianEntries();

  return posts.map((post: any) => ({
    slug: post.id,
  }));
}

export interface Props {
  params: {
    slug: string;
  };
}
