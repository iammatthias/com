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

  return (
    <div className={`${components.comments}`}>
      <p>
        When a post URL is share on Farcaster (a sufficiently decentralized
        social network) the comments are displayed permissionessly, allowing
        readers to participate contextually.
      </p>
      <ul className={`${components.commentList}`}>
        <>
          {_topLevelComments.map((comment) => {
            return (
              <li key={comment.merkleRoot} className={`${components.comment}`}>
                <div className={`${components.commentTopRow}`}>
                  <small>
                    <Link
                      href={`https://www.discove.xyz/profiles/${comment.username}`}
                    >
                      @{comment.username}
                    </Link>
                  </small>

                  <small>
                    {new Date(comment.publishedAt).toLocaleDateString(`en-US`)}
                  </small>
                </div>
                <p>{comment.text}</p>
                <small>
                  <Link
                    href={`https://www.discove.xyz/casts/${comment.merkleRoot}`}
                  >
                    View on Discove ↝
                  </Link>
                </small>
                {comment.numReplyChildren > 0 && (
                  <ul className={`${components.commentList}`}>
                    {_merkleRootComments[0]
                      .map((comment) => {
                        return (
                          <li
                            key={comment.merkleRoot}
                            className={`${components.comment}`}
                          >
                            <div className={`${components.commentTopRow}`}>
                              <small>
                                <Link
                                  href={`https://www.discove.xyz/profiles/${comment.username}`}
                                >
                                  @{comment.username}
                                </Link>
                              </small>

                              <small>
                                {new Date(
                                  comment.publishedAt,
                                ).toLocaleDateString(`en-US`)}
                              </small>
                            </div>
                            <p>{comment.text}</p>
                            <small>
                              <Link
                                href={`https://www.discove.xyz/casts/${comment.merkleRoot}`}
                              >
                                View on Discove ↝
                              </Link>
                            </small>
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
