import { Suspense } from "react";
import Airtable from "airtable";
import Image from "next/image";
import Video from "@/app/components/video";
import Squiggle from "@/app/components/squiggle";
import Link from "next/link";
import RouteUpdater from "@/app/lib/route_updater";
import styles from "./styles.module.css";

import Loader from "@/app/components/loader";

async function fetchRecords() {
  const baseId = process.env.NEXT_PUBLIC_AIRTABLE_BASE as string;
  const airtableApiKey = process.env.NEXT_PUBLIC_AIRTABLE_API_KEY as string;

  var base = new Airtable({ apiKey: airtableApiKey }).base(baseId);
  const records = await base("Art")
    .select({
      view: "Grid view",
      sort: [{ field: "Updated", direction: "desc" }],
    })
    .all();
  const recordsJson = records.map((record) => record._rawJson);

  return { recordsJson };
}

const MediaComponent = ({ media, record, index }: any) => {
  if (media.type.includes("image")) {
    return (
      <section className={styles.section} key={index} id={index}>
        <div className={styles.art}>
          <Link href={`/media/${record.id}`} className={styles.media__link}>
            <Image
              src={`https://wsrv.nl/?w=900&dpr=2&url=${media.thumbnails.full.url}`}
              alt={record.fields.Name + " " + index}
              width={media.thumbnails.full.width}
              height={media.thumbnails.full.height}
              priority={true}
            />
          </Link>
          <RecordMeta record={record} />
        </div>
      </section>
    );
  } else if (media.type.includes("video")) {
    return (
      <section className={styles.section} key={index} id={index}>
        <div className={styles.art}>
          <Video src={media.url} />
          <RecordMeta record={record} />
        </div>
      </section>
    );
  }
  return null;
};

const RecordMeta = ({ record }: any) => (
  <div className={styles.record__meta}>
    <div className={styles.record__meta__name}>
      <Link href={`/media/${record.id}`} className={styles.media__link}>
        <p>{record.fields.Name}</p>
      </Link>
      <Squiggle />
    </div>
    <p className={styles.date}>
      Last updated:{" "}
      {new Date(record.fields.Updated)
        .toLocaleDateString("sv-SE")
        .replace(/-/g, "/")}
    </p>
    <div className={styles.pill__box}>
      {record.fields.Collection.map((collection: any) => (
        <p key={collection} className={styles.pill}>
          {collection}
        </p>
      ))}
    </div>
    {/* <p>{record.fields.Description}</p> */}
  </div>
);

export default async function AllArtList() {
  const { recordsJson: records } = await fetchRecords();
  return (
    <RouteUpdater>
      {records.map((record, recordIndex) => {
        const mediaArray = record.fields.Media;
        const randomIndex = Math.floor(Math.random() * mediaArray.length);
        const media = mediaArray[randomIndex];

        return media ? (
          <Suspense key={recordIndex} fallback={<Loader />}>
            <MediaComponent media={media} record={record} index={recordIndex} />
          </Suspense>
        ) : null;
      })}
    </RouteUpdater>
  );
}
