"use client";

import React, { useState, useEffect, memo } from "react";
import AutoLink, {
  fetchMerkleRootCasts,
  fetchTopLevelCasts,
} from "@/app/lib/farcaster";

import styles from "./comments.module.scss";
import Link from "next/link";

async function getCommentsByMerkleRoot(merkleRoot: string) {
  const casts = await fetchMerkleRootCasts(merkleRoot);

  if (!Array.isArray(casts)) {
    return [];
  }

  const sortedComments = casts.sort((a, b) => {
    return b.body.publishedAt - a.body.publishedAt;
  });

  return sortedComments.map((comment) => {
    const {
      body: {
        username,
        publishedAt,
        data: { text },
      },
      meta: { numReplyChildren },
      merkleRoot,
    } = comment;
    return { merkleRoot, numReplyChildren, username, publishedAt, text };
  });
}

async function getCommentData(slug: string) {
  const topLevelCasts = await fetchTopLevelCasts(slug);

  const comments = await Promise.all(
    topLevelCasts.map(async (comment: any) => {
      const {
        body: {
          username,
          publishedAt,
          data: { text },
        },
        meta: { numReplyChildren },
        merkleRoot,
        uri,
      } = comment;

      const replyComments = getCommentsByMerkleRoot(merkleRoot);

      return {
        merkleRoot,
        uri,
        numReplyChildren,
        username,
        publishedAt,
        text,
        replyComments,
      };
    })
  );

  return comments;
}

const CommentTopRow = memo(({ username, publishedAt }: any) => (
  <div className={`${styles.commentTopRow}`}>
    <Link href={`https://www.discove.xyz/profiles/${username}`}>
      <p>@{username}</p>
    </Link>

    <p>{new Date(publishedAt).toLocaleDateString(`en-US`)}</p>
  </div>
));

const CommentLink = memo(({ type, href }: any) => (
  <Link href={`${href}`}>
    <p>View on {type} ↝</p>
  </Link>
));

const CommentBottomRow = memo(({ merkleRoot, uri }: any) => (
  <div className={`${styles.commentBottomRow}`}>
    <CommentLink type='Farcaster' href={uri} />
    <CommentLink
      type='Discove'
      href={`https://www.discove.xyz/casts/${merkleRoot}`}
    />
  </div>
));

const CommentBody = memo((comment: any) => {
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

const CommentDescendants = memo(({ comments }: any) => {
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
