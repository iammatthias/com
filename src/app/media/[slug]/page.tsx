import { Suspense } from "react";
import Airtable from "airtable";
import styles from "./page.module.css";
import RecordMeta from "@/app/components/media_display/recordMeta";
import Mason from "@/app/components/masonry";
import MediaComponent from "@/app/components/media_display/mediaComponent";
import MoonSunMoon from "@/app/components/moon_sun_moon";
import Link from "next/link";

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
      <Link href='/'>
        <MoonSunMoon />
      </Link>
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
