import { Suspense } from "react";

import styles from "./styles.module.css";
import MoonSunMoon from "@/app/components/moon_sun_moon";
import AllArtList from "@/app/components/all_art_list";

export default async function Posts() {
  return (
    <>
      <section className={styles.section}>
        <MoonSunMoon />
        <p>Hi, I am Matthias, and I make things that I think are beautiful.</p>
      </section>

      <Suspense
        fallback={
          <section className={styles.section}>
            <MoonSunMoon />
            <p>loading</p>
          </section>
        }>
        <AllArtList />
      </Suspense>
    </>
  );
}
