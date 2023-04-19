const AIRTABLE_API_KEY = process.env.NEXT_PUBLIC_AIRTABLE_API_KEY;

export default async function fetchAirtableData(
  baseID?: string,
  table?: string
) {
  if (!baseID) {
    throw new Error("Base ID is not provided");
  }

  if (!table) {
    throw new Error("Table is not provided");
  }

  const apiKey = AIRTABLE_API_KEY;
  const url = `https://api.airtable.com/v0/${baseID}/${table}?view=Grid%20view`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch data");
  }

  return res.json();
}
