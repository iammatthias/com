import Link from "next/link";
import { getArweaveEntries } from "../data/arweaveEntries";
import { getObsidianEntries } from "../data/obsidianEntries";
import page from "./page.module.css";

export default async function Home() {
  const entries: any = await getData();

  return (
    <article>
      <p>I'm a photographer & marketing technologist who builds sustainable growth systems.</p>

      <p>Currently at Tornado—an education-first investing platform focused on financial literacy. Previously I worked at Aspiration, Surf Air, and General Assembly.</p>

      <p>If you are interested in collaborating, please reach out at hey@iammatthias.com</p>
      {entries.sortedEntries.map((post: any) => {
        return post.source === "arweave" ? (
          <div key={post.digest} className={page.list}>
            <p>
              <small>{post.timestamp}</small>
            </p>
            <p>
              <Link href={`/arweave/${post.transaction}`}>{post.title}</Link>
            </p>
          </div>
        ) : post.source === "obsidian" ? (
          <div key={post.title} className={page.list}>
            <p>
              <small>{post.timestamp}</small>
            </p>
            <p>
              <Link href={`/md/${post.slug}`}>{post.title}</Link>
            </p>
            {!post.longform && <p>{post.body}</p>}
          </div>
        ) : null;
      })}
    </article>
  );
}

async function getData() {
  const arweaveEntries = await getArweaveEntries();
  const obsidianEntries = await getObsidianEntries();
  const _obsidianEntries = await Promise.all(obsidianEntries);

  const entries = [...arweaveEntries, ..._obsidianEntries];

  const sortedEntries = entries.sort((a: { timestamp: number }, b: { timestamp: number }) => b.timestamp - a.timestamp);

  return {
    sortedEntries,
    revalidate: 1 * 60 * 60, // refresh article contents every hour
  };
}
