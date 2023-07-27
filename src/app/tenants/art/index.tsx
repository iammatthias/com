import { Suspense } from "react";
import Airtable from "airtable";
import Image from "next/image";
import { getPlaiceholder } from "plaiceholder";

import styles from "./styles.module.css";
import MoonSunMoon from "@/app/components/moon_sun_moon";
import Video from "@/app/components/video";
import Squiggle from "@/app/components/squiggle";
import RouteUpdater from "@/app/lib/route_updater";
import Link from "next/link";

async function getPlaceholder(src: string) {
  try {
    const buffer = await fetch(src).then(async (res) =>
      Buffer.from(await res.arrayBuffer())
    );
    const { base64 } = await getPlaiceholder(buffer);
    return base64;
  } catch (err) {
    console.error(err);
    return "";
  }
}

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

  const placeholders = await Promise.all(
    recordsJson.flatMap((record) =>
      record.fields.Media.map((media: any) =>
        media.type.includes("image")
          ? getPlaceholder(media.thumbnails.small.url)
          : null
      )
    )
  );

  return { recordsJson, placeholders };
}

const MediaComponent = ({ media, record, index, placeholder }: any) => {
  if (media.type.includes("image") && placeholder) {
    return (
      <section className={styles.section} key={index} id={index}>
        <div className={styles.art}>
          <Link href={`/media/${record.id}`} className={styles.media__link}>
            <Image
              src={`https://wsrv.nl/?url=${media.thumbnails.full.url}`}
              alt={record.fields.Name + " " + index}
              width={media.thumbnails.full.width}
              height={media.thumbnails.full.height}
              placeholder='blur'
              blurDataURL={placeholder}
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

export default async function Posts() {
  const { recordsJson: records, placeholders } = await fetchRecords();

  return (
    <>
      <section className={styles.section}>
        <MoonSunMoon />
        <p>Hi, I am Matthias, and I make things that I think are beautiful.</p>
      </section>

      <Suspense
        fallback={
          <section className={styles.section}>
            <MoonSunMoon />
            <p>loading</p>
          </section>
        }>
        <RouteUpdater>
          {/* {records.map((record, recordIndex) =>
            record.fields.Media.map((media: any, mediaIndex: number) => {
              const placeholderIndex =
                recordIndex * record.fields.Media.length + mediaIndex;
              const placeholder = placeholders[placeholderIndex];

              return (
                <MediaComponent
                  media={media}
                  record={record}
                  index={`${recordIndex}-${mediaIndex}`}
                  placeholder={placeholder}
                />
              );
            })
          )} */}
          {/* {records.map((record, recordIndex) => {
            const media = record.fields.Media[0];
            const placeholder = placeholders[recordIndex];

            return media ? (
              <MediaComponent
                media={media}
                record={record}
                index={`${recordIndex}-0`}
                placeholder={placeholder}
              />
            ) : null;
          })} */}
          {records.map((record, recordIndex) => {
            const mediaArray = record.fields.Media;
            const randomIndex = Math.floor(Math.random() * mediaArray.length);
            const media = mediaArray[randomIndex];
            const placeholder = placeholders[recordIndex];

            return media ? (
              <MediaComponent
                media={media}
                record={record}
                index={`${recordIndex}-${randomIndex}`}
                placeholder={placeholder}
              />
            ) : null;
          })}
        </RouteUpdater>
      </Suspense>
    </>
  );
}
