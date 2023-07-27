import Squiggle from "@/app/components/squiggle";
import styles from "./styles.module.css";

export default function RecordMeta({ record }: any) {
  return (
    <div className={styles.record__meta}>
      <div className={styles.record__meta__name}>
        <p>{record.fields.Name}</p>
        <Squiggle />
      </div>
      <div className={styles.pill__box}>
        {record.fields.Collection.map((collection: any) => (
          <p key={collection} className={styles.pill}>
            {collection}
          </p>
        ))}
      </div>
      <p>{record.fields.Description}</p>
    </div>
  );
}
