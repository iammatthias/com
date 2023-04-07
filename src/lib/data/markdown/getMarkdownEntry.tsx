import { compileMDX } from "next-mdx-remote/rsc";
import { Components } from "@/lib/providers/mdxProvider";

// set token
const token = process.env.NEXT_PUBLIC_GITHUB;

export default async function getMarkdownEntry(path: string) {
  // console.log(path);
  const res = await fetch(
    `https://api.github.com/repos/iammatthias/Obsidian/contents/${path}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: `application/vnd.github+json`,
        "X-GitHub-Api-Version": "2022-11-28",
      },
    }
  )
    .then((response) => response.json())
    .catch((err) => console.error(err));

  const { content } = res;

  const mdxSource = await compileMDX({
    source: Buffer.from(content, "base64").toString("utf-8"),
    options: {
      parseFrontmatter: true,
    },
    //@ts-expect-error Server Component
    components: Components,
  });

  return {
    frontmatter: mdxSource.frontmatter,
    content: mdxSource.content,
  };
}
