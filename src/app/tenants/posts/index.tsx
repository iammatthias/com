import styles from "./styles.module.css";

import Link from "next/link";
import { getObsidianEntries } from "@/app/lib/github";
import Squiggle from "@/app/components/squiggle";
import { Suspense } from "react";
import MoonSunMoon from "@/app/components/moon_sun_moon";
import AllPostsList from "@/app/components/all_posts_list";

export default async function Posts() {
  return (
    <>
      <section className={styles.section}>
        <Link href='/'>
          <MoonSunMoon />
        </Link>
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
        <AllPostsList />
      </Suspense>
    </>
  );
}
