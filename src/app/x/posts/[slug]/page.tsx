import Comments from "@/app/components/Comments";
import fetchMarkdownEntry from "@/app/data/fetch/github/fetchMarkdownEntry";
import { Suspense } from "react";

export interface Props {
  params?: any;
  searchParams?: any;
}

export default async function PostPage({ params }: Props) {
  if (!params.slug) {
    return <>Loading...</>;
  }

  const data = await fetchMarkdownEntry(`Content/${params.slug}.md`).then(
    (markdownEntry) => ({
      created: Number(params.slug),
      id: params.slug,
      name: markdownEntry.frontmatter.title,
      conditionals: markdownEntry.frontmatter.conditionals,
      fields: {
        content: markdownEntry.content,
        ...markdownEntry.frontmatter.fields,
      },
    })
  );

  return (
    <>
      <h1>{data.name}</h1>
      <h2>{new Date(data.created).toLocaleDateString()}</h2>
      <hr />
      {data.fields.content}
      <Suspense>
        {/* @ts-expect-error Server Component */}
        <Comments slug={`${params.slug}`} />
      </Suspense>
    </>
  );
}
