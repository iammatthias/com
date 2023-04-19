import { compileMDX } from "next-mdx-remote/rsc";
import { ReactElement } from "react";

type Frontmatter = {
  title: string;
  id: string;
  created: string;
  conditionals: {
    isLongform: boolean;
    isPublished: boolean;
    isWalletGated: boolean;
  };
  fields: {
    span: number;
    doubleHeight: boolean;
    source: string;
    description: string;
  };
};

interface MarkdownEntry {
  frontmatter: Frontmatter;
  content: ReactElement;
}

const token = process.env.NEXT_PUBLIC_GITHUB;

export default async function fetchMarkdownEntry(
  path: string
): Promise<MarkdownEntry> {
  try {
    const url = `https://api.github.com/repos/iammatthias/Obsidian/contents/${path}`;
    const headers = {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    };

    const response = await fetch(url, { method: "GET", headers });
    const responseData = await response.json();
    const { content } = responseData;

    const mdxSource = await compileMDX({
      source: Buffer.from(content, "base64").toString("utf-8"),
      options: {
        parseFrontmatter: true,
      },
    });

    return {
      frontmatter: mdxSource.frontmatter as Frontmatter,
      content: mdxSource.content,
    };
  } catch (error) {
    console.log(error);
    return {
      frontmatter: {
        title: "",
        id: "",
        created: "",
        conditionals: {
          isLongform: false,
          isPublished: false,
          isWalletGated: false,
        },
        fields: {
          span: 1,
          doubleHeight: false,
          source: "",
          description: "",
        },
      },
      content: <></>,
    };
  }
}
