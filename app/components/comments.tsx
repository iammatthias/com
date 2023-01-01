import getTopLevelCasts from '@/data/farcaster/getTopLevelCasts';
import getMerkleRoot from '@/data/farcaster/getMerkleRootCasts';
import components from './components.module.css';
import Link from 'next/link';

// get merkleroot for all top level casts
async function getTopLevelComments(path: string, slug: string) {
  const casts = await getTopLevelCasts(path, slug);
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
      <div className={`${components.commentTopRow}`}>
        <small>
          <Link href={`https://www.discove.xyz/profiles/${username}`}>@{username}</Link>
        </small>

        <small>{new Date(publishedAt).toLocaleDateString(`en-US`)}</small>
      </div>
    );
  }

  type ViewOnDiscoveProps = {
    merkleRoot: string;
  };

  function ViewOnDiscove({ merkleRoot }: ViewOnDiscoveProps) {
    return (
      <small>
        <Link href={`https://www.discove.xyz/casts/${merkleRoot}`}>
          View on Discove ↝
        </Link>
      </small>
    );
  }

  type ViewOnFarcasterProps = {
    uri: string;
  };

  function ViewOnFarcaster({ uri }: ViewOnFarcasterProps) {
    return (
      <small>
        <Link href={`${uri}`}>View on Farcaster ↝</Link>
      </small>
    );
  }

  type CommentBottomRowProps = {
    merkleRoot: string;
    uri: string;
  };

  function CommentBottomRow({ merkleRoot, uri }: CommentBottomRowProps) {
    return (
      <div className={`${components.commentBottomRow}`}>
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
      <ul key={merkleRoot} className={`${components.commentList}`}>
        {_comments
          .map((comment) => {
            return (
              <li key={comment.merkleRoot} className={`${components.comment}`}>
                <CommentBody {...comment} />
              </li>
            );
          })
          .slice(0, -1)}
      </ul>
    );
  }

  return (
    <div className={`${components.comments}`}>
      <p>
        When a post URL is shared on{` `}
        <Link href="https://www.farcaster.xyz/" target="_blank" rel="noreferrer">
          Farcaster
        </Link>
        {` `}
        (a sufficiently decentralized social network) the comments are displayed
        permissionessly below.
      </p>
      <ul className={`${components.commentList}`}>
        <>
          {/* {_topLevelComments.map((comment) => {
            return (
              <li
                key={comment.merkleRoot + comment.publishedAt}
                className={`${components.comment}`}
              >
                <CommentBody {...comment} />
                {comment.numReplyChildren > 0 && (
                  <ul key={comment.merkleRoot} className={`${components.commentList}`}>
                    {_merkleRootComments[0]
                      .map((comment) => {
                        return (
                          <li
                            key={comment.merkleRoot}
                            className={`${components.comment}`}
                          >
                            <CommentBody {...comment} />
                          </li>
                        );
                      })
                      .slice(0, -1)}
                  </ul>
                )}
              </li>
            );
          })} */}
          {_topLevelComments.map((comment) => {
            return (
              <li
                key={comment.merkleRoot + comment.publishedAt}
                className={`${components.comment}`}
              >
                <CommentBody {...comment} />
              </li>
            );
          })}
        </>
      </ul>
    </div>
  );
}
