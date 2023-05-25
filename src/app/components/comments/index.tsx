"use client";

import React, { useState, useEffect, memo } from "react";
import AutoLink, {
  fetchMerkleRootCasts,
  fetchTopLevelCasts,
} from "@/app/lib/farcaster";

import styles from "./comments.module.scss";
import Link from "next/link";

async function getCommentsByMerkleRoot(merkleRoot: string) {
  // ... function code ...
}

async function getCommentData(slug: string) {
  // ... function code ...
}

const CommentTopRow = memo(function CommentTopRow({
  username,
  publishedAt,
}: any) {
  return (
    <div className={`${styles.commentTopRow}`}>
      <Link href={`https://www.discove.xyz/profiles/${username}`}>
        <p>@{username}</p>
      </Link>

      <p>{new Date(publishedAt).toLocaleDateString(`en-US`)}</p>
    </div>
  );
});
CommentTopRow.displayName = "CommentTopRow";

const CommentLink = memo(function CommentLink({ type, href }: any) {
  return (
    <Link href={`${href}`}>
      <p>View on {type} ↝</p>
    </Link>
  );
});
CommentLink.displayName = "CommentLink";

const CommentBottomRow = memo(function CommentBottomRow({
  merkleRoot,
  uri,
}: any) {
  return (
    <div className={`${styles.commentBottomRow}`}>
      <CommentLink type='Farcaster' href={uri} />
      <CommentLink
        type='Discove'
        href={`https://www.discove.xyz/casts/${merkleRoot}`}
      />
    </div>
  );
});
CommentBottomRow.displayName = "CommentBottomRow";

const CommentBody = memo(function CommentBody(comment: any) {
  const {
    merkleRoot,
    uri,
    username,
    publishedAt,
    text,
    numReplyChildren,
    replyComments,
  } = comment;

  return (
    <>
      <CommentTopRow username={username} publishedAt={publishedAt} />
      <AutoLink text={text} />
      <CommentBottomRow merkleRoot={merkleRoot} uri={uri} />
      {numReplyChildren > 0 && <CommentDescendants comments={replyComments} />}
    </>
  );
});
CommentBody.displayName = "CommentBody";

const CommentDescendants = memo(function CommentDescendants({ comments }: any) {
  if (!comments) return null;

  return (
    <ul className={`${styles.commentList}`}>
      {comments.slice(0, -1).map((comment: any) => (
        <li className={`${styles.comment}`} key={comment.merkleRoot}>
          <CommentBody {...comment} />
        </li>
      ))}
    </ul>
  );
});
CommentDescendants.displayName = "CommentDescendants";

type Props = {
  slug: string;
};

export default function Comments({ slug }: Props) {
  const [comments, setComments] = useState([]);

  useEffect(() => {
    (async () => {
      const data = await getCommentData(slug);
      setComments(data as any);
    })();
  }, [slug]);

  return (
    <div className={`${styles.comments}`}>
      <hr />
      <p>
        Comments are displayed when relevant content is shared on{" "}
        <Link
          href='https://www.farcaster.xyz/'
          target='_blank'
          rel='noreferrer'>
          Farcaster
        </Link>
        .
      </p>
      <ul className={`${styles.commentList}`}>
        {comments.map((comment: any) => (
          <li
            className={`${styles.comment}`}
            key={comment.merkleRoot + comment.publishedAt}>
            <CommentBody {...comment} />
          </li>
        ))}
      </ul>
    </div>
  );
}
