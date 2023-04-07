import styles from "./bookmarks.module.scss";
import RemoteImage from "../remoteImage";
import { MDXRemote } from "next-mdx-remote/rsc";
import Link from "next/link";
import { Components } from "@/lib/providers/mdxProvider";
import linkify from "markdown-linkify";

export default async function Bookmarks() {
  const res = await fetch(
    `https://www.discove.xyz/api/feeds/iammatthias/old-perls?p=1`,
    {
      next: {
        revalidate: 5 * 60,
      },
    }
  );

  // Recommendation: handle errors
  if (!res.ok) {
    // This will activate the closest `error.js` Error Boundary
    throw new Error("Failed to fetch data");
  }
  const {
    feed: { results },
  } = await res.json();

  return (
    <div className={`${styles.entries} entries`}>
      {results.map((cast: any) => {
        if (
          cast.reply_to_data &&
          cast.hash !=
            "0xbde00c218da1b0a00e748e49146f5ce2b0b1337ee7cf9fb3faa442372ce8c550"
        ) {
          const _cast = cast.reply_to_data;
          return (
            <div key={_cast.hash} className={styles.entry}>
              <div className={styles.entry__meta__wrapper}>
                <div className={styles.entry__meta}>
                  <Link
                    href={`https://www.discove.xyz/profiles/${_cast.username}`}>
                    <h6>@{_cast.username}</h6>
                  </Link>
                  <h6>
                    {new Date(_cast.published_at).toLocaleDateString(`en-US`)}
                  </h6>
                </div>
                <hr />
              </div>

              <div className={styles.entry__content__wrapper}>
                <>
                  {/* @ts-expect-error */}

                  <MDXRemote
                    source={linkify(_cast.text)}
                    // @ts-expect-error
                    components={Components}
                  />
                </>
              </div>

              <div className={styles.entry__meta}>
                <Link href={`${_cast.uri}`}>
                  <h6>View on Farcaster ↝</h6>
                </Link>

                <Link href={`https://www.discove.xyz/casts/${_cast.hash}`}>
                  <h6>View on Discove ↝</h6>
                </Link>
              </div>
            </div>
          );
        } else {
          return null;
        }
      })}
    </div>
  );
}
