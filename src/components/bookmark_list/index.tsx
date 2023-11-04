import Airtable from "airtable";
import styles from "./styles.module.css";
import { CustomMDX } from "@/lib/custom_mdx";

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

  return records.recordsJson.map((record) => (
    <div key={record.id} className={styles.bookmark}>
      <p>
        <strong>{record.fields.username}</strong> {record.fields.display_name}
      </p>
      <CustomMDX source={record.fields.text} />

      <p>
        Posted: {new Date(record.fields.published_at).toLocaleDateString()}, Bookmarked:{" "}
        {new Date(record.fields.bookmarked_at).toLocaleDateString()}
      </p>
    </div>
  ));
}
