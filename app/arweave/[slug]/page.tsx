import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkStringify from "remark-stringify";
import ReactMarkdown from "react-markdown";
import { getArweaveEntry, getArweaveEntryPaths } from "../../../data/arweaveEntries";
import uriTransformer from "../../../utils/uriTransformer";
import page from "./page.module.css";
import Link from "next/link";

export interface Props {
  params: any;
  searchParams?: any;
}

export default async function Page({ params, searchParams }: Props) {
  const entry = await getData(params.slug);

  return (
    <article>
      <h1>{entry.title}</h1>
      <ReactMarkdown transformLinkUri={uriTransformer}>{entry.body}</ReactMarkdown>
      <div className={page.transaction}>
        <small>
          Tx:{" "}
          <Link href={`https://viewblock.io/arweave/tx/${entry.transaction}`} target='_blank'>
            {entry.transaction}
          </Link>
        </small>
        <p>
          <small>
            Contributor:{" "}
            <Link href={`https://etherscan.io/address/${entry.contributor}`} target='_blank'>
              {entry.contributor}
            </Link>
          </small>
        </p>
      </div>
    </article>
  );
}

export async function generateStaticParams() {
  const paths = await getArweaveEntryPaths();

  return paths.map((post: { slug: any }) => ({
    slug: post.slug,
  }));
}

async function getData(digest: string) {
  const entry = await getArweaveEntry(digest);

  const body = await unified()
    .use(remarkParse) // Parse markdown
    .use(remarkStringify) // Serialize markdown
    .process(entry.body);

  return {
    ...entry,
    body: String(body),
    revalidate: 1 * 60 * 60, // refresh article contents every hour
  };
}
