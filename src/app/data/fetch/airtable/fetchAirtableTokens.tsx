import fetchAirtableData from "./fetchAirtableData";
import formatAirtableData from "./formatAirtableData";

export interface AirtableToken {
  id: string;
  created: string;
  conditional: {
    isToken: boolean;
    isWalletGated: boolean;
  };
  fields: {};
}

export default async function fetchAirtableTokens() {
  const baseID = process.env.NEXT_PUBLIC_AIRTABLE_BASE_ID;
  const table = "Tokens";
  const rawData = await fetchAirtableData(baseID, table);
  const data = formatAirtableData(rawData);

  return data;
}
