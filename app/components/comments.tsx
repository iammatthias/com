import getTopLevelCasts from '@/data/farcaster/getTopLevelCasts';
import getMerkleRoot from '@/data/farcaster/getMerkleRoot';
import components from './components.module.css';
import Link from 'next/link';

// get merkleroot for all top level casts
async function getTopLevelComments(slug: string) {
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
    } = comment;
    return { merkleRoot, numReplyChildren, username, publishedAt, text };
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
  slug: string;
};

export default async function Comments({ slug }: Props) {
  // merkle roots for top level comments
  const topLevelComments = await getTopLevelComments(slug);
  // get casts by merkle root
  const _topLevelComments = await Promise.all(topLevelComments);

  const merkleRootComments = _topLevelComments.map(async (comment) => {
    const merkleRoot = await getMerkleRootComments(comment.merkleRoot);
    const _merkleRoot = await Promise.all(merkleRoot);
    return _merkleRoot;
  });

  const _merkleRootComments = await Promise.all(merkleRootComments);

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

  function CommentBody({ merkleRoot, username, publishedAt, text }: any) {
    return (
      <>
        <CommentTopRow username={username} publishedAt={publishedAt} />
        <p>{text}</p>
        <ViewOnDiscove merkleRoot={merkleRoot} />
      </>
    );
  }

  return (
    <div className={`${components.comments}`}>
      <p>
        When a post URL is shared on Farcaster (a sufficiently decentralized social
        network) the comments are displayed permissionessly below.
      </p>
      <ul className={`${components.commentList}`}>
        <>
          {_topLevelComments.map((comment) => {
            return (
              <li key={comment.merkleRoot} className={`${components.comment}`}>
                <CommentBody {...comment} />
                {comment.numReplyChildren > 0 && (
                  <ul className={`${components.commentList}`}>
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
          })}
        </>
      </ul>
    </div>
  );
}
