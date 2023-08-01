import { getObsidianEntries } from "@/app/lib/github";
import Link from "next/link";
import Squiggle from "@/app/components/squiggle";
import styles from "./styles.module.css";

export default async function AllPostsList() {
  let allPosts = await getObsidianEntries();

  allPosts = allPosts.reverse();

  // if in a dev enviroment show all posts
  // if in a prod enviroment show only public posts

  if (process.env.NODE_ENV === "production") {
    allPosts = allPosts.filter((post: any) => post.public === true);
  }

  return allPosts.map((post: any) => (
    <section className={styles.section} key={post.slug}>
      <Link href={`/post/${post.slug}`}>
        <>
          <Squiggle />
          <h1>{post.name}</h1>

          <p className={styles.date}>
            This post was published{" "}
            {new Date(post.created)
              .toLocaleDateString("sv-SE")
              .replace(/-/g, "/")}{" "}
            {post.updated !== post.created &&
              `& last updated ${new Date(post.updated)
                .toLocaleDateString("sv-SE")
                .replace(/-/g, "/")}`}
          </p>

          {post.tags && (
            <div className={styles.pill_box}>
              {post.tags.map((item: string, i: any) => (
                <span className={styles.pill} key={i}>
                  {item}
                </span>
              ))}
            </div>
          )}
        </>
      </Link>
    </section>
  ));
}
