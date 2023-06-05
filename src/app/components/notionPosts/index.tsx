import { getAllPublished } from "@/app/lib/notion";
import styles from "./notion.module.scss";
import rss from "@/app/lib/feed";

export default async function NotionPosts() {
  const posts = await getAllPublished();

  setImmediate(async () => {
    await rss(posts);
  });

  return (
    <section className={`${styles.posts}`}>
      {posts.map((post) => (
        <div className={`${styles.post}`} key={post.id}>
          <p className={`${styles.post__title}`}>
            <a href={`/content/${post.id}`}>{post.name}</a>
          </p>
          <p className={`${styles.post__type}`}>{post.type}</p>
        </div>
      ))}
    </section>
  );
}
