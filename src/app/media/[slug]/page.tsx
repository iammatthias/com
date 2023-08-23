import { Suspense } from "react";
import Airtable from "airtable";
import styles from "./page.module.css";
import RecordMeta from "@/app/components/media_display/recordMeta";
import Mason from "@/app/components/masonry";
import MediaComponent from "@/app/components/media_display/mediaComponent";
import Nav from "@/app/components/nav";

export default async function Media({ params }: Props) {
  const baseId = process.env.NEXT_PUBLIC_AIRTABLE_BASE as string;
  const airtableApiKey = process.env.NEXT_PUBLIC_AIRTABLE_API_KEY as string;
  var base = new Airtable({ apiKey: airtableApiKey }).base(baseId);
  const record = (await base("Art").find(params.slug)) as any;

  const media = record.fields.Media.map((media: any, index: number) => (
    <MediaComponent media={media} record={record} index={index} key={index} />
  ));

  return (
    <section className={styles.section}>
      <Nav />
      <main className={styles.main}>
        <RecordMeta record={record} />
        <Suspense
          fallback={
            <section className={styles.section}>
              <p>loading</p>
            </section>
          }>
          {/* {record.fields.Media.map((media: any, index: number) => (
          <MediaComponent media={media} record={record} index={index} />
        ))} */}
          <Mason items={media} />
        </Suspense>
      </main>
    </section>
  );
}

export interface Props {
  params: {
    slug: string;
  };
}
