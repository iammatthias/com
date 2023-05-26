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
          <p>
            Bookmarked at{" "}
            <FormatDateTime inputDate={bookmark.bookmarked_at} format='FULL' />
          </p>
          <div className={`${styles.bookmark__meta}`}>
            <p>
              <Link href={``}>@{bookmark.username}</Link>
            </p>
            <p>
              <FormatDateTime inputDate={bookmark.published_at} format='FULL' />
            </p>
          </div>
          <hr />
          <>
            <CustomMDX source={bookmark.text} />
          </>
        </div>
      ))}
    </section>
  );
}
