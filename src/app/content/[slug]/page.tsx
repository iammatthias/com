import { CustomMDX } from "@/app/lib/customMdx";
import { getSinglePost } from "@/app/lib/notion";
import styles from "./page.module.scss";

export interface Props {
  params: {
    slug: string;
  };
}

export default async function Post({ params }: Props) {
  if (!params?.slug) {
    return <>Loading...</>;
  }

  const post = await getSinglePost(params.slug);

  function localDateString(date: string) {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  return (
    <>
      <div className={`${styles.post__meta}`}>
        <h1>{post.metadata.name}</h1>
        <div className={`${styles.post__dates}`}>
          <p>Published: {localDateString(post.metadata.created)}</p>
          <p>Updated: {localDateString(post.metadata.updated)}</p>
        </div>
        <div className={`${styles.post__tags}`}>
          {post.metadata.tags.map((tag) => (
            <span key={tag} className={`${styles.post__tag}`}>
              {tag}
            </span>
          ))}
        </div>
        <hr />
      </div>

      <CustomMDX source={post.markdown.parent} />
    </>
  );
}
