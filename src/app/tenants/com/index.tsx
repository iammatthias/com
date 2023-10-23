import { Suspense } from "react";
import styles from "./styles.module.css";
import Link from "next/link";
import AllPostsList from "@/app/components/all_posts_list";
import Glass from "@/app/components/glass";

export default async function Com() {
  return (
    <>
      <section className={styles.section}>
        <h1>Hi, I am Matthias</h1>

        <p>I am a photographer and growth technologist based in Southern California.</p>

        <p>
          My work has taken me to{" "}
          <b>
            <i>Revance (Opul)</i>
          </b>
          ,{" "}
          <b>
            <i>Tornado</i>
          </b>
          ,{" "}
          <b>
            <i>Aspiration</i>
          </b>
          , and{" "}
          <b>
            <i>Surf Air</i>
          </b>
          , where I&apos;ve worked on design systems, led strategic growth initiatives, and built marketing operations.
        </p>

        <p>
          Let's work together ~{" "}
          <Link href='ma&#105;lto&#58;&#37;&#54;&#56;%65&#121;%40i%61mm&#97;&#116;%7&#52;hias&#46;&#99;om'>
            h&#101;y&#64;&#105;amm&#97;&#116;thias&#46;com
          </Link>
        </p>
      </section>
      {/* <section className={styles.section}>
        <p>
          <Link href='https://iammatthias.com'>Learn a bit more about me</Link>, or{" "}
          <Link href='https://iammatthias.art'>check out some of my art</Link>.
        </p>
      </section> */}
      <section className={styles.section}>
        <Glass limit={9} />
      </section>
      <Suspense fallback={<section className={styles.section}>Loading...</section>}>
        <AllPostsList />
      </Suspense>
      <section className={styles.section}>
        <Glass limit={9} offset={9} />
      </section>
    </>
  );
}
