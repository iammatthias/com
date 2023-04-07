import styles from "./page.module.scss";

import getMarkdownEntry from "@/lib/data/markdown/getMarkdownEntry";
import { Suspense } from "react";
import Comments from "@/ui/comments";

export interface Props {
  params?: any;
  searchParams?: any;
}

export default async function PostPage({ params }: Props) {
  if (!params.slug) {
    return <>Loading...</>;
  }

  const entry = await getMarkdownEntry(`Content/${params.slug}.md`);

  const { frontmatter, content } = entry;

  if (frontmatter) {
    const created = new Date(
      1 * (frontmatter.created as any)
    ).toLocaleDateString(`en-US`, {
      timeZone: `America/Los_Angeles`,
    });

    return (
      <>
        <div className={styles.entry__head}>
          <div className={styles.entry__meta}>
            <h6>{created}</h6>
            <h6>{frontmatter.source as any}</h6>
          </div>
          <hr />
          {frontmatter.title !== frontmatter.created && (
            <h1>{frontmatter.title as any}</h1>
          )}
        </div>
        {content}
        {frontmatter.longform && (
          <Suspense>
            {/* @ts-expect-error Server Component */}
            <Comments path={`md`} slug={`${params.slug}`} />
          </Suspense>
        )}
      </>
    );
  } else {
    return null;
  }
}
