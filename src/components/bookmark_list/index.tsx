import Airtable from "airtable";
import styles from "./styles.module.css";
import { CustomMDX } from "@/lib/custom_mdx";

export const revalidate = 60;

async function fetchRecords() {
  const baseId = process.env.NEXT_PUBLIC_AIRTABLE_BASE as string;
  const airtableApiKey = process.env.NEXT_PUBLIC_AIRTABLE_API_KEY as string;

  var base = new Airtable({ apiKey: airtableApiKey }).base(baseId);
  const records = await base("Bookmarks")
    .select({
      view: "Grid view",
      sort: [{ field: "bookmarked_at", direction: "desc" }],
    })
    .all();
  const recordsJson = records.map((record) => record._rawJson);

  return { recordsJson };
}

export default async function BookmarkList() {
  const records = await fetchRecords();

  return (
    <ul className={styles.ul_bookmarks}>
      {records.recordsJson.map((record) => (
        <li key={record.id} className={styles.li_bookmark}>
          <ul>
            <li>
              <strong>{record.fields.username}</strong> {record.fields.display_name}
            </li>

            <li>
              <CustomMDX source={record.fields.text} />
            </li>

            <li>
              Posted: {new Date(record.fields.published_at).toLocaleDateString()}, Bookmarked:{" "}
              {new Date(record.fields.bookmarked_at).toLocaleDateString()}
            </li>
          </ul>
        </li>
      ))}
    </ul>
  );
}
