import { getAllPublished } from "@/app/lib/notion";
import styles from "./notion.module.scss";

export default async function NotionPosts() {
  const posts = await getAllPublished();

  return (
    <div className={`${styles.posts}`}>
      {posts.map((post) => (
        <div className={`${styles.post}`}>
          <p className={`${styles.post__title}`}>
            <a href={`/content/${post.id}`} key={post.id}>
              {post.name}
            </a>
          </p>
          <p className={`${styles.post__type}`}>{post.type}</p>
        </div>
      ))}
    </div>
  );
}
