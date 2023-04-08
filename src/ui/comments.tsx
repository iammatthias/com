import getTopLevelCasts from "@/lib/data/farcaster/getTopLevelCasts";
import getMerkleRoot from "@/lib/data/farcaster/getMerkleRootCasts";
import styles from "./comments.module.scss";
import Link from "next/link";
import { Suspense } from "react";

// get merkleroot for all top level casts
async function getTopLevelComments(path: string, slug: string) {
  const casts = await getTopLevelCasts(slug);
  const comments = await Promise.all(casts);

  return comments.map((comment) => {
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
    return { merkleRoot, uri, numReplyChildren, username, publishedAt, text };
  });
}

// get casts by merkleroot
async function getMerkleRootComments(merkleRoot: string) {
  const casts = await getMerkleRoot(merkleRoot);
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

type Props = {
  path: string;
  slug: string;
};

export default async function Comments({ path, slug }: Props) {
  // merkle roots for top level comments
  const topLevelComments = await getTopLevelComments(path, slug);
  // get casts by merkle root
  const _topLevelComments = await Promise.all(topLevelComments);

  type CommentTopRowProps = {
    username: string;
    publishedAt: number;
  };

  function CommentTopRow({ username, publishedAt }: CommentTopRowProps) {
    return (
      <div className={`${styles.commentTopRow}`}>
        <Link href={`https://www.discove.xyz/profiles/${username}`}>
          <h6>@{username}</h6>
        </Link>

        <h6>{new Date(publishedAt).toLocaleDateString(`en-US`)}</h6>
      </div>
    );
  }

  type ViewOnDiscoveProps = {
    merkleRoot: string;
  };

  function ViewOnDiscove({ merkleRoot }: ViewOnDiscoveProps) {
    return (
      <Link href={`https://www.discove.xyz/casts/${merkleRoot}`}>
        <h6>View on Discove ↝</h6>
      </Link>
    );
  }

  type ViewOnFarcasterProps = {
    uri: string;
  };

  function ViewOnFarcaster({ uri }: ViewOnFarcasterProps) {
    return (
      <Link href={`${uri}`}>
        <h6>View on Farcaster ↝</h6>
      </Link>
    );
  }

  type CommentBottomRowProps = {
    merkleRoot: string;
    uri: string;
  };

  function CommentBottomRow({ merkleRoot, uri }: CommentBottomRowProps) {
    return (
      <div className={`${styles.commentBottomRow}`}>
        <ViewOnFarcaster uri={uri} />
        <ViewOnDiscove merkleRoot={merkleRoot} />
      </div>
    );
  }

  function CommentBody({
    merkleRoot,
    uri,
    username,
    publishedAt,
    text,
    numReplyChildren,
  }: any) {
    return (
      <>
        <CommentTopRow username={username} publishedAt={publishedAt} />
        <p>{text}</p>
        <CommentBottomRow merkleRoot={merkleRoot} uri={uri} />
        {/* @ts-expect-error Server Component */}
        {numReplyChildren > 0 && <CommentDescendants merkleRoot={merkleRoot} />}
      </>
    );
  }

  async function CommentDescendants({ merkleRoot }: any) {
    const comments = await getMerkleRootComments(merkleRoot);
    const _comments = await Promise.all(comments);
    return (
      <ul key={merkleRoot} className={`${styles.commentList}`}>
        {_comments
          .map((comment) => {
            return (
              <Suspense>
                <li key={comment.merkleRoot} className={`${styles.comment}`}>
                  <CommentBody {...comment} />
                </li>
              </Suspense>
            );
          })
          .slice(0, -1)}
      </ul>
    );
  }

  return (
    <div className={`${styles.comments}`}>
      <hr />
      <ul className={`${styles.commentList}`}>
        <>
          {_topLevelComments.map((comment) => {
            return (
              <Suspense key={comment.merkleRoot + comment.publishedAt}>
                <li className={`${styles.comment}`}>
                  <CommentBody {...comment} />
                </li>
              </Suspense>
            );
          })}
        </>
      </ul>
      <small>
        Comments are displayed when a post URL is shared on{` `}
        <Link
          href='https://www.farcaster.xyz/'
          target='_blank'
          rel='noreferrer'>
          Farcaster
        </Link>
        {` `}
        (a sufficiently decentralized social network).
      </small>
    </div>
  );
}
