import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import { getArweaveEntries } from '../data/arweaveEntries';
import { getObsidianEntries } from '../data/obsidianEntries';
import uriTransformer from '../utils/uriTransformer';
import { components } from '../utils/markdown';
import page from './page.module.css';
import rehypeRaw from 'rehype-raw';

export const revalidate = 0; // no-cache

export default async function Home() {
  const entries: any = await getData();

  const isDev = process.env.NODE_ENV === 'development';

  return (
    <article>
      <p>
        I'm a photographer & marketing technologist, and have worked with wonderful teams at Tornado, Aspiration, Surf
        Air, and General Assembly.
      </p>

      <p>
        Want to collaborate? Reach out ⇝{' '}
        <Link href="mailto:hey@iammatthias.com?subject=Collab&body=Hey%20Matthias%2C%0D%0A%0D%0A...">
          hey@iammatthias.com
        </Link>
      </p>
      {entries.sortedEntries.map((post: any) => {
        return (
          (isDev ? isDev : post.published) && (
            <div key={post.timestamp} className={page.list}>
              <Link href={post.source === `obsidian` ? `/md/${post.slug}` : `/arweave/${post.transaction}`}>
                <div className={page.listTopRow}>
                  <p>
                    <small>{new Date(post.timestamp).toLocaleDateString('en-US')}</small>
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
                  <Link href={post.source === `obsidian` ? `/md/${post.slug}` : `/arweave/${post.transaction}`}>
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
                  children={post.body}
                />
              )}
            </div>
          )
        );
      })}
    </article>
  );
}

async function getData() {
  const arweaveEntries = await getArweaveEntries();
  const obsidianEntries = await getObsidianEntries();
  const _obsidianEntries = await Promise.all(obsidianEntries);

  const entries = [...arweaveEntries, ..._obsidianEntries];

  const sortedEntries = entries.sort((a: any, b: any) => {
    return b.timestamp - a.timestamp;
  });

  return {
    sortedEntries,
    revalidate: 10,
    next: { revalidate: 60 },
  };
}
