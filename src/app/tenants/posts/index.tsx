import styles from "./styles.module.css";

import Link from "next/link";
import MoonSunMoon from "@/app/components/moon_sun_moon";
import { getObsidianEntries } from "@/app/lib/github";
import Squiggle from "@/app/components/squiggle";
import { Suspense } from "react";

export default async function Posts() {
  let allPosts = await getObsidianEntries();

  allPosts = allPosts.reverse();

  // if in a dev enviroment show all posts
  // if in a prod enviroment show only public posts

  if (process.env.NODE_ENV === "production") {
    allPosts = allPosts.filter((post: any) => post.public === true);
  }

  return (
    <>
      <section className={styles.section}>
        <MoonSunMoon />
        <p>Hi, I am Matthias — here are some things I&apos;ve written.</p>

        <p>
          There is this sense that your presence on the web needs to be
          perfectly refined — but what part of us ever really is?
        </p>
        <p>
          This is an attempt at getting away from that. An open-ended collection
          of thoughts, ideas, and things I&apos;ve worked on, created, or found
          interesting.
        </p>

        <p>
          While I hope you enjoy it, these thoughts are my own. They&apos;ll
          grow and shift over time. Some may take root. Others might be pruned
          away.
        </p>

        <p>
          <Link href='https://iammatthias.com'>Learn a bit more about me</Link>,
          or{" "}
          <Link href='https://iammatthias.art'>check out some of my art</Link>.
        </p>
      </section>
      <Suspense fallback={<article>Loading...</article>}>
        {allPosts.map((post: any) => (
          <article className={styles.article} key={post.slug}>
            <Link href={`/post/${post.slug}`}>
              <>
                <Squiggle />
                <h1>{post.name}</h1>
                <div className={styles.article__dates}>
                  <p className={styles.date}>
                    This post was published{" "}
                    {new Date(post.created)
                      .toLocaleDateString("sv-SE")
                      .replace(/-/g, "/")}{" "}
                    {post.updated !== post.created &&
                      `& last updated ${new Date(post.updated)
                        .toLocaleDateString("sv-SE")
                        .replace(/-/g, "/")}`}
                  </p>
                </div>
                {post.tags && (
                  <div className={styles.pill_box}>
                    {post.tags.map((item: string, i: any) => (
                      <span className={styles.pill} key={i}>
                        {item}
                      </span>
                    ))}
                  </div>
                )}
              </>
            </Link>
          </article>
        ))}
      </Suspense>
    </>
  );
}
