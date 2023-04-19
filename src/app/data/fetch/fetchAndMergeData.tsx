import fetchTokenData from "@/app/data/fetch/onchain/fetchTokenData";
import fetchAirtableTokens from "@/app/data/fetch/airtable/fetchAirtableTokens";
import fetchMarkdownEntries from "@/app/data/fetch/github/fetchMarkdownEntries";
import fetchMarkdownEntry from "@/app/data/fetch/github/fetchMarkdownEntry";

interface GithubEntry {
  name: string;
  path: string;
}

interface AirtableEntry {
  id: string;
  created: number;
  conditional: {
    isToken: boolean;
    isWalletGated: boolean;
  };
  fields: any;
}

type MergedEntry = {
  created: number;
  id: string;
  name: string;
  conditionals: any;
  fields: any;
};

export default async function fetchAndMergeData() {
  try {
    const markdownEntries: GithubEntry[] = await fetchMarkdownEntries();
    const airtableTokens: AirtableEntry[] = await fetchAirtableTokens();

    const mergedDataPromises: Promise<MergedEntry>[] = [];

    for (const entry of markdownEntries) {
      mergedDataPromises.push(
        fetchMarkdownEntry(entry.path).then((markdownEntry) => ({
          created: Number(entry.name.slice(0, -3)),
          id: entry.name.slice(0, -3),
          name: markdownEntry.frontmatter.title,
          conditionals: markdownEntry.frontmatter.conditionals,
          fields: {
            content: markdownEntry.content,
            ...markdownEntry.frontmatter.fields,
          },
        }))
      );
    }

    for (const entry of airtableTokens) {
      mergedDataPromises.push(
        fetchTokenData(entry.fields.address, entry.fields.token).then(
          (tokenData) => ({
            created: entry.created,
            id: entry.id,
            name: tokenData.name,
            conditionals: {
              isToken: true,
              isWalletGated: true,
            },
            fields: {
              ...entry.fields,
              tokenType: tokenData.tokenType,
              name: tokenData.name,
              description: tokenData.description,
              contentURL: tokenData.contentURL.replace(
                "ipfs://",
                "https://gateway.ipfs.io/ipfs/"
              ),
              contentURLMimeType: tokenData.contentURLMimeType,
            },
          })
        )
      );
    }

    const mergedData: MergedEntry[] = await Promise.all(mergedDataPromises);

    const sortedData = mergedData.sort((a, b) => {
      return b.created - a.created;
    });

    return sortedData;
  } catch (error) {
    console.error(error);
    return [];
  }
}
