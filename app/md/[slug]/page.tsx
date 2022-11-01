import ReactMarkdown from "react-markdown";
import { getObsidianEntry, getObsidianEntries } from "../../../data/obsidianEntries";
import uriTransformer from "../../../utils/uriTransformer";

export default async function Page({ params }: { params: { slug: any }; searchParams: { id: any } }) {
  if (!params.slug) {
    return <>Loading...</>;
  }

  const entry = await getData(params.slug);

  return (
    <article>
      <h1>{entry.title}</h1>
      <ReactMarkdown transformLinkUri={uriTransformer}>{entry.body}</ReactMarkdown>
    </article>
  );
}

export async function generateStaticParams() {
  const paths = await getObsidianEntries();

  const _paths = await Promise.all(paths);

  return _paths.map((post: { slug: string }) => ({
    slug: post.slug,
  }));
}

async function getData(slug: string) {
  const entry = await getObsidianEntry(slug);

  return entry;
}
