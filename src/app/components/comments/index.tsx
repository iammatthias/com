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

  const comments = await Promise.all(casts);

  const sortedComments = comments.sort((a, b) => {
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
  const topLevelComments = await Promise.all(topLevelCasts);

  const comments = await Promise.all(
    topLevelComments.map(async (comment) => {
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

      const replyComments = await getCommentsByMerkleRoot(merkleRoot);

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
  username,
}: any) {
  return (
    <div className={`${styles.commentBottomRow}`}>
      <CommentLink
        type='Warpcast'
        href={`https://warpcast.com/${username}/${merkleRoot}`}
      />
    </div>
  );
});
CommentBottomRow.displayName = "CommentBottomRow";

const CommentBody = memo(function CommentBody(comment: any) {
  const {
    merkleRoot,
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
      <CommentBottomRow merkleRoot={merkleRoot} username={username} />
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
    comments && (
      <div className={`${styles.comments}`}>
        <hr />
        <p>
          Comments are displayed when content is shared on the{" "}
          <Link
            href='https://www.farcaster.xyz/'
            target='_blank'
            rel='noreferrer'>
            Farcaster
          </Link>{" "}
          protocol .
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
    )
  );
}
