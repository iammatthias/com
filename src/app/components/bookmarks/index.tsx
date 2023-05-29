import { fetchSupabaseData } from "@/app/lib/supabase";
import styles from "./bookmarks.module.scss";
import { CustomMDX } from "@/app/lib/customMdx";
import Link from "next/link";
import FormatDateTime from "@/app/lib/formatDateTime";

export default async function NotionPosts() {
  const data = await fetchSupabaseData();

  const _data = data?.reverse();

  return (
    <section className={`${styles.bookmarks}`}>
      {_data?.map((bookmark: any) => (
        <div key={bookmark.hash} className={`${styles.bookmark}`}>
          <div className={`${styles.bookmark__meta}`}>
            <small>
              <Link href={`https://warpcast.com/${bookmark.username}`}>
                @{bookmark.username}
              </Link>
            </small>
            <small>
              <FormatDateTime inputDate={bookmark.published_at} format='FULL' />
            </small>
          </div>
          <hr />
          <>
            <CustomMDX source={bookmark.text} />
          </>
          <hr />
          <div className={`${styles.bookmark__meta}`}>
            <small>
              Bookmarked at{" "}
              <FormatDateTime
                inputDate={bookmark.bookmarked_at}
                format='FULL'
              />
            </small>
            <small>
              View on{" "}
              <Link
                href={`https://warpcast.com/${bookmark.username}/${bookmark.hash}`}>
                Warpcast
              </Link>
            </small>
          </div>
        </div>
      ))}
    </section>
  );
}
