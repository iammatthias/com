import getMarkdownEntries from "@/lib/data/markdown/getMarkdownEntries";
import styles from "./xyz.module.scss";
import Link from "next/link";
import { Suspense } from "react";
import getMarkdownEntry from "@/lib/data/markdown/getMarkdownEntry";
import DateAndTime from "../dateAndTime";
import GeoMeta from "../geoMeta";

import EntryWrapper from "../entryWrapper";

export default async function Xyz() {
  const entries = await getMarkdownEntries();

  async function Entry(entry: any) {
    const _entry = await getMarkdownEntry(entry.entry.path);

    const { frontmatter, content } = _entry;

    if (frontmatter) {
      const created = new Date(
        1 * (frontmatter.created as any)
      ).toLocaleDateString(`en-US`, {
        timeZone: `America/Los_Angeles`,
      });

      // in development, we want to see all entries
      // in production we only want to see entries that are published (frontmatter.published == true)

      // const showContent = frontmatter.published;

      const showContent =
        process.env.NODE_ENV === `development` ? true : frontmatter.published;

      const wallet = false;

      const showWalletGated = wallet ? true : !frontmatter.walletGated;

      // const showContent = true;

      if (showContent) {
        return (
          // <EntryWrapper
          //   walletGated={frontmatter.walletGated}
          //   key={entry.entry.sha}>
          //   <Link
          //     href={`/posts/${frontmatter.created}`}
          //     className={styles.entry}>
          //     <>
          //       <div className={styles.entry__meta}>
          //         <h6>{created}</h6>
          //         <h6>{frontmatter.source as any}</h6>
          //       </div>
          //       <hr />

          //       {frontmatter.title !== frontmatter.created && (
          //         <h5>{frontmatter.title as any}</h5>
          //       )}

          //       {!frontmatter.longform && content}
          //       {/* {frontmatter.longform && <p>{frontmatter.excerpt}</p>} */}
          //     </>
          //   </Link>
          // </EntryWrapper>

          <Link href={`/posts/${frontmatter.created}`} className={styles.entry}>
            <>
              <div className={styles.entry__meta}>
                <h6>{created}</h6>
                <h6>{frontmatter.source as any}</h6>
              </div>
              <hr />

              {frontmatter.title !== frontmatter.created && (
                <h5>{frontmatter.title as any}</h5>
              )}

              {!frontmatter.longform && content}
              {/* {frontmatter.longform && <p>{frontmatter.excerpt}</p>} */}
            </>
          </Link>
        );
      } else {
        return null;
      }
    } else {
      return null;
    }
  }

  return (
    <>
      <div className={`${styles.entries} entries`}>
        <div className={styles.entry}>
          <Suspense>
            <DateAndTime />
          </Suspense>
          <p>፥፥ ፥፥&nbsp;&nbsp;☾ ☼ ☽&nbsp;&nbsp;፥፥ ፥፥</p>
          <Suspense>
            {/* @ts-expect-error */}
            <GeoMeta />
          </Suspense>
        </div>

        {entries
          .map((entry: any) => (
            <Suspense key={entry.sha}>
              {/* @ts-expect-error */}
              <Entry entry={entry} />
            </Suspense>
          ))
          .reverse()}
      </div>
    </>
  );
}
