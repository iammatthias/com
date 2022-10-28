import Link from "next/link";
import { getEntries } from "../data/entries";
import page from "./page.module.css";

export default async function Home() {
  const entries: any = await getData();

  console.log(entries);
  return (
    <article>
      <p>I'm a photographer & marketing technologist who builds sustainable growth systems.</p>

      <p>Currently at Tornado—an education-first investing platform focused on financial literacy. Previously I worked at Aspiration, Surf Air, and General Assembly.</p>

      <p>If you are interested in collaborating, please reach out at hey@iammatthias.com</p>
      {entries.sortedEntries.map((post: any) => (
        <div key={post.digest} className={page.arweaveList}>
          <p>
            <Link href={`/${post.transaction}`}>{post.title}</Link>
          </p>
          <p>
            <small>Timestamp: {post?.timestamp}</small>
          </p>
        </div>
      ))}
    </article>
  );
}

async function getData() {
  const entries = await getEntries();
  const sortedEntries = entries.sort((a: { timestamp: number }, b: { timestamp: number }) => b.timestamp - a.timestamp);

  return {
    sortedEntries,
    revalidate: 1 * 60 * 60, // refresh article contents every hour
  };
}
