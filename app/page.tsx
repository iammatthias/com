import { Suspense } from 'react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import uriTransformer from '../utils/uriTransformer';
import { components } from '../utils/markdown';
import page from './page.module.css';
import rehypeRaw from 'rehype-raw';

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
      <p>Photographer & marketing technologist.</p>
      <p>
        I have worked with wonderful teams at Tornado, Aspiration, Surf Air, and General
        Assembly.
      </p>

      <p>
        Want to collaborate? Reach out ⇝{` `}
        <Link href="mailto:hey@iammatthias.com?subject=Collab&body=Hey%20Matthias%2C%0D%0A%0D%0A...">
          hey@iammatthias.com
        </Link>
      </p>
      <Suspense fallback={<p>Loading...</p>}>
        {entries.map((post: any) => {
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
                      <small>
                        {new Date(post.timestamp).toLocaleDateString(`en-US`)}
                      </small>
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
                  <ReactMarkdown
                    transformLinkUri={uriTransformer}
                    components={{
                      // img: components.image as any,
                      iframe: components.iframe,
                      p: components.paragraph as any,
                    }}
                    rehypePlugins={[rehypeRaw]}
                  >
                    {post.body}
                  </ReactMarkdown>
                )}
              </div>
            )
          );
        })}
      </Suspense>
    </article>
  );
}
