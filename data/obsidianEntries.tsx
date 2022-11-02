import { githubQL } from "../lib/graphql";

import fetchEntries from "../queries/obsidian/fetchEntries";

import matter from "gray-matter";

export const getObsidianEntries = async () => {
  const {
    data: {
      repository: {
        object: { entries },
      },
    },
  } = await githubQL.query({
    query: fetchEntries,
    variables: { owner: `iammatthias`, name: `obsidian`, first: 100 },
  });

  return entries.map(async (entry: any) => {
    const content = entry.object.text;

    const parsedContent = matter(content);

    const {
      data: { title, created, longform, published },
      content: body,
    } = parsedContent;

    return {
      slug: title,
      title: title,
      longform: longform,
      published: published,
      timestamp: created * 1,
      body: body,
      source: `obsidian`,
    };
  });
};

export const getObsidianEntry = async (slug: any) => {
  const paths = await getObsidianEntries();

  const _paths = await Promise.all(paths);

  const entry = _paths.find((entry: any) => entry.slug === slug);

  return entry;
};
