import Squiggle from "@/app/components/squiggle";
import { CustomMDX } from "@/app/lib/custom_mdx";

import styles from "./page.module.css";
import { getObsidianEntry, getObsidianEntries } from "@/app/lib/github";
import MoonSunMoon from "@/app/components/moon_sun_moon";
import Link from "next/link";

// revalidate every 60 seconds
export const revalidate = 60;

export default async function Post({ params }: Props) {
  console.log("params", params);

  const post = await getObsidianEntry(params.slug);

  return (
    <section className={styles.section}>
      <Link href='/'>
        <MoonSunMoon />
      </Link>

      <main className={styles.main}>
        <h1>{post.name}</h1>
        <div className={styles.article__dates}>
          <p className={styles.date}>This post was published {post.created}</p>
          {post.updated !== post.created && (
            <p className={styles.date}>& last updated {post.updated}</p>
          )}
        </div>
        {/* {post.tokenAddress && (
          <p>
            {post.tokenAddress} / {post.tokenId}
          </p>
        )} */}
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
        <article className={styles.article}>
          <CustomMDX source={post.body} />
        </article>
      </main>
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
