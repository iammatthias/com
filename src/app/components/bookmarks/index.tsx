import { fetchSupabaseData } from "@/app/lib/supabase";
import styles from "./bookmarks.module.scss";
import { CustomMDX } from "@/app/lib/customMdx";
import Link from "next/link";
import FormatDateTime from "@/app/lib/formatDateTime";

export default async function NotionPosts() {
  const data = await fetchSupabaseData();

  // {
  //   hash: '0x2ae7e0530024bea1d2c18bc756a83c76737c8cc9',
  //   text: 'http://zora.energy https://i.imgur.com/pPXmqkm.jpg',
  //   username: 'ccarella',
  //   thread_hash: '0x2ae7e0530024bea1d2c18bc756a83c76737c8cc9',
  //   display_name: 'Chris Carella 🛡️',
  //   published_at: '2023-05-25T21:17:31+00:00',
  //   bookmarked_at: '2023-05-25T21:34:20+00:00'
  // }

  // reverse the data

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
