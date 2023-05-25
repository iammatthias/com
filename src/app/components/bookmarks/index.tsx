import { fetchSupabaseData } from "@/app/lib/supabase";
import styles from "./bookmarks.module.scss";
import { CustomMDX } from "@/app/lib/customMdx";

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
        <article key={bookmark.hash} className={`${styles.bookmark}`}>
          <div className={`${styles.bookmark__meta}`}>
            <p>@{bookmark.username}</p>
            <p>{bookmark.published_at}</p>
          </div>
          <hr />
          <CustomMDX source={bookmark.text} />
        </article>
      ))}
    </section>
  );
}
