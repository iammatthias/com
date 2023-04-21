import Comments from "@/app/components/Comments";
import fetchArweaveEntry from "@/app/data/fetch/arweave/fetchArweaveEntry";
import { compileMDX } from "next-mdx-remote/rsc";
import { Suspense } from "react";

export interface Props {
  params?: any;
  searchParams?: any;
}

export default async function ArweavePage({ params }: Props) {
  if (!params.slug) {
    return <>Loading...</>;
  }

  const data = await fetchArweaveEntry(params.slug).then((arweaveData) => ({
    created: arweaveData.publishedAt,
    id: arweaveData.id,
    name: arweaveData.title,
    conditionals: {
      isArweave: true,
      isLongform: true,
      isToken: false,
    },
    fields: {
      name: arweaveData.title,
      description: arweaveData.subtitle,
      source: "Arweave",
      content: arweaveData.markdown,
    },
  }));

  const mdxSource = await compileMDX({
    source: data.fields.content,
    options: {
      parseFrontmatter: true,
    },
  });

  return (
    <>
      <h1>{data.name}</h1>
      <h2>{new Date(data.created).toLocaleDateString()}</h2>
      <hr />
      {mdxSource.content}
      <Suspense>
        {/* @ts-expect-error Server Component */}
        <Comments slug={`${params.slug}`} />
      </Suspense>
    </>
  );
}
