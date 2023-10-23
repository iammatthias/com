import { getObsidianEntries } from "@/lib/github";
import Link from "next/link";
import Squiggle from "@/components/squiggle";
import styles from "./styles.module.css";

export default async function AllPostsList() {
  let allPosts = await getObsidianEntries();

  allPosts = allPosts.reverse();

  // if in a dev enviroment show all posts
  // if in a prod enviroment show only public posts

  if (process.env.NODE_ENV === "production") {
    allPosts = allPosts.filter((post: any) => post.public === true);
  }

  return (
    <section className={styles.section}>
      {allPosts.map((post: any) => (
        <Link href={`/post/${post.slug}`} key={post.slug}>
          <>
            <Squiggle />
            <h1>{post.name}</h1>

            <p className={styles.date}>
              This post was published {new Date(post.created).toLocaleDateString("sv-SE").replace(/-/g, "/")}{" "}
              {post.updated !== post.created &&
                `& last updated ${new Date(post.updated).toLocaleDateString("sv-SE").replace(/-/g, "/")}`}
            </p>

            {/* {post.tags && (
            <div className={styles.pill_box}>
              {post.tags.map((item: string, i: any) => (
                <span className={styles.pill} key={i}>
                  {item}
                </span>
              ))}
            </div>
          )} */}
          </>
        </Link>
      ))}
      <Squiggle />
    </section>
  );
}
