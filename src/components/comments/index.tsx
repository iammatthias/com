import { Suspense } from "react";
import { getCastThreads } from "@/lib/searchcaster";
import { CustomMDX } from "@/lib/custom_mdx";
import Link from "next/link";

import styles from "./styles.module.css";

function elapsedTime(timestamp: number) {
  const msPerHour = 1000 * 60 * 60;
  const msPerDay = msPerHour * 24;
  const now = Date.now();
  const elapsed = now - timestamp;

  if (elapsed < msPerDay) {
    return Math.round(elapsed / msPerHour) + "h";
  } else {
    return Math.round(elapsed / msPerDay) + "d";
  }
}

function ParentComment({ comment }: { comment: any }) {
  console.log(comment);

  // If the comment has a parent, it's not a top-level comment
  if (comment.body.data.replyParentMerkleRoot !== null) {
    return null;
  }

  return <CommentBody comment={comment} />;
}

function ChildComment({ childComments }: { childComments: any }) {
  if (!Array.isArray(childComments)) {
    // Handle the case where children is not an array (including undefined)
    return null;
  }

  return childComments.map((comment: any) => <CommentBody key={comment.merkleRoot} comment={comment} />);
}

function CommentBody({ comment }: { comment: any }) {
  return (
    <li>
      <p className={styles.meta}>
        {comment.meta.displayName} =~{" "}
        <Link href={`https://warpcast.com/${comment.body.username}`}>@{comment.body.username} </Link> =~{" "}
        {elapsedTime(comment.body.publishedAt)}
      </p>
      <CustomMDX source={comment.body.data.text} />
      <p>
        <Link href={`https://warpcast.com/${comment.body.username}/${comment.merkleRoot}`}>
          View on Warpcast -&gt;{" "}
        </Link>
      </p>
      {comment?.children > 0 && (
        <ul>
          <ChildComment childComments={comment.children} />
        </ul>
      )}
    </li>
  );
}

export default async function Comments({ slug }: { slug: string }) {
  const topLevelCasts = await getCastThreads(slug);

  if (topLevelCasts.length === 0) {
    return null;
  }

  return (
    <>
      <p>
        Join the conversation on <Link href={`https://warpcast.com/`}>Warpcast</Link>.
      </p>

      <Suspense fallback={<div>Loading...</div>}>
        <ul className={styles.comments}>
          {topLevelCasts.map((comment) => (
            <ParentComment key={comment.merkleRoot} comment={comment} />
          ))}
        </ul>
      </Suspense>
    </>
  );
}
