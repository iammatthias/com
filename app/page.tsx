import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { getArweaveEntries } from "../data/arweaveEntries";
import { getObsidianEntries } from "../data/obsidianEntries";
import uriTransformer from "../utils/uriTransformer";
import page from "./page.module.css";

export const revalidate = 0; // no-cache

export default async function Home() {
  const entries: any = await getData();

  return (
    <article>
      <p>I'm a photographer & marketing technologist who builds sustainable growth systems.</p>

      <p>Currently at Tornado—an education-first investing platform focused on financial literacy. Previously I worked at Aspiration, Surf Air, and General Assembly.</p>

      <p>If you are interested in collaborating, please reach out at hey@iammatthias.com</p>
      {entries.sortedEntries.map((post: any) => {
        return (
          post.published && (
            <div key={post.timestamp} className={page.list}>
              <div className={page.listTopRow}>
                <p>
                  <small>{new Date(post.timestamp).toLocaleDateString("en-US")}</small>
                </p>
                <p>
                  <small>
                    <i>{post.source}</i>
                  </small>
                </p>
              </div>
              <p>
                <Link href={post.source === `obsidian` ? `/md/${post.slug}` : `/arweave/${post.transaction}`}>{post.title}</Link>
              </p>
              {post.longform === false && <ReactMarkdown transformLinkUri={uriTransformer}>{post.body}</ReactMarkdown>}
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
  };
}
