import { Suspense } from 'react';
import Link from 'next/link';

import page from './page.module.css';

import MarkdownProvider from '@/utils/markdownProvider';

import getArweaveEntries from '@/data/arweave/getArweaveEntries';
import getObsidianEntries from '@/data/obsidian/getObsidianEntries';

async function getData() {
  const arweaveEntries = await getArweaveEntries();
  const obsidianEntries = await getObsidianEntries();

  const entries = await Promise.all([...arweaveEntries, ...obsidianEntries]);

  const sortedEntries = entries.sort((a: any, b: any) => {
    return b.timestamp - a.timestamp;
  });

  return {
    sortedEntries,
  };
}

export default async function Home() {
  const data: any = await getData();

  const entries = data.sortedEntries;

  const isDev = process.env.NODE_ENV === `development`;

  return (
    <article>
      <p>
        I am a photographer & marketing technologist—and have worked with wonderful teams
        at groups like <Link href="https://tornado.com/">Tornado</Link>,{` `}
        <Link href="https://www.aspiration.com/">Aspiration</Link>,{` `}
        <Link href="https://www.surfair.com/">Surf Air</Link>, and{` `}
        <Link href="https://generalassemb.ly/">General Assembly</Link>.
      </p>

      <p>
        Want to collaborate? Reach out ⇝{` `}
        <Link href="mailto:hey@iammatthias.com?subject=Collab&body=Hey%20Matthias%2C%0D%0A%0D%0A...">
          hey@iammatthias.com
        </Link>
      </p>
      {/* <Suspense fallback={<p>Loading...</p>}> */}
      {entries.map((post: any) => {
        const pstTimestamp = new Date(post.timestamp).toLocaleString(`en-US`, {
          timeZone: `America/Los_Angeles`,
        });

        return (
          (isDev ? isDev : post.published) && (
            <div key={post.timestamp} className={page.list}>
              <Link
                href={
                  post.source === `obsidian`
                    ? `/md/${post.slug}`
                    : `/arweave/${post.transaction}`
                }
              >
                <div className={page.listTopRow}>
                  <p>
                    <small>{new Date(pstTimestamp).toLocaleDateString()}</small>
                  </p>
                  <p>
                    <small>
                      <i>{post.source}</i>
                    </small>
                  </p>
                </div>
              </Link>

              {post.title != post.timestamp && (
                <p>
                  <Link
                    href={
                      post.source === `obsidian`
                        ? `/md/${post.slug}`
                        : `/arweave/${post.transaction}`
                    }
                  >
                    {post.title}
                  </Link>
                </p>
              )}
              {post.longform === false && (
                <MarkdownProvider>{post.body}</MarkdownProvider>
              )}
            </div>
          )
        );
      })}
      {/* </Suspense> */}
    </article>
  );
}
