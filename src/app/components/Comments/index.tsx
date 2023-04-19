import fetchTopLevelCasts from "@/app/data/fetch/farcaster/fetchTopLevelCasts";
import fetchMerkleRootCasts from "@/app/data/fetch/farcaster/fetchMerkleRootCasts";
import AutoLink from "@/app/lib/autolink";

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

type Props = {
  slug: string;
};

export default async function Comments({ slug }: Props) {
  const comments = await getCommentData(slug);

  function CommentTopRow({ username, publishedAt }: any) {
    return (
      <div className={`${styles.commentTopRow}`}>
        <Link href={`https://www.discove.xyz/profiles/${username}`}>
          <p>@{username}</p>
        </Link>

        <p>{new Date(publishedAt).toLocaleDateString(`en-US`)}</p>
      </div>
    );
  }

  function CommentLink({ type, href }: any) {
    return (
      <Link href={`${href}`}>
        <p>View on {type} ↝</p>
      </Link>
    );
  }

  function CommentBottomRow({ merkleRoot, uri }: any) {
    return (
      <div className={`${styles.commentBottomRow}`}>
        <CommentLink type='Farcaster' href={uri} />
        <CommentLink
          type='Discove'
          href={`https://www.discove.xyz/casts/${merkleRoot}`}
        />
      </div>
    );
  }

  function CommentBody(comment: any) {
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
        {numReplyChildren > 0 && (
          <CommentDescendants comments={replyComments} />
        )}
      </>
    );
  }

  function CommentDescendants({ comments }: any) {
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
  }

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
